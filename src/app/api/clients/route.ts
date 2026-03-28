
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, push, child, update, query, orderByChild, equalTo } from "firebase/database";
import { getCurrentUser, createAuditLog } from "@/lib/auth";
import { generateNumber, sanitizeForFirebase } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    // With Firebase RTDB, complex filtering and pagination is hard.
    // For this migration, we will fetch all clients and filter/paginate in memory.
    // This is not scalable for millions of records but suitable for small-medium apps or this migration phase.

    const clientsRef = ref(db, 'clients');
    const snapshot = await get(clientsRef);

    let clients: any[] = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const client = childSnapshot.val();
        clients.push({ id: childSnapshot.key, ...client });
      });
    }

    // Filter by deletion (soft delete check if applicable)
    clients = clients.filter(c => !c.deletedAt);

    // Filter by agent if applicable
    if (user.role === "AGENT") {
      clients = clients.filter(c => c.agentId === user.userId || c.createdById === user.userId);
    }

    // Apply Search
    if (search) {
      const searchLower = search.toLowerCase();
      clients = clients.filter(client =>
        (client.firstName && client.firstName.toLowerCase().includes(searchLower)) ||
        (client.lastName && client.lastName.toLowerCase().includes(searchLower)) ||
        (client.clientNumber && client.clientNumber.toLowerCase().includes(searchLower)) ||
        (client.idNumber && client.idNumber.toLowerCase().includes(searchLower)) ||
        (client.phone && client.phone.includes(search)) ||
        (client.email && client.email.toLowerCase().includes(searchLower))
      );
    }

    // Apply Status
    if (status === "active") {
      clients = clients.filter(c => c.isActive);
    } else if (status === "inactive") {
      clients = clients.filter(c => !c.isActive);
    }

    // Sort by createdAt desc
    clients.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    // Pagination
    const total = clients.length;
    const startIndex = (page - 1) * limit;
    const paginatedClients = clients.slice(startIndex, startIndex + limit);

    // To mimic the "include: policies, _count" from Prisma, we need to fetch those too.
    // This creates N+1 problem. For now, let's leave related data empty or do a second fetch if strictly needed.
    // The UI likely needs policy count.

    // Let's fetch policies once to map them.
    const policiesSnapshot = await get(ref(db, 'policies'));
    const policiesMap: Record<string, any[]> = {}; // clientId -> policies

    if (policiesSnapshot.exists()) {
      policiesSnapshot.forEach((child) => {
        const pol = child.val();
        if (!pol.deletedAt && pol.clientId) {
          if (!policiesMap[pol.clientId]) policiesMap[pol.clientId] = [];
          policiesMap[pol.clientId].push({ id: child.key, ...pol });
        }
      });
    }

    // Enhance clients with basic counts
    const enhancedClients = paginatedClients.map(client => ({
      ...client,
      policies: policiesMap[client.id] || [], // Return actual policies as UI might show details
      _count: {
        policies: (policiesMap[client.id] || []).length,
        dependents: 0, // Implement dependent fetch if needed
        claims: 0 // Implement claim fetch if needed
      }
    }));

    return NextResponse.json({
      clients: enhancedClients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const clientNumber = generateNumber("RFS");

    // Check for existing ID Number
    const clientsRef = ref(db, 'clients');
    // Using query for efficiency on single field check
    const idQuery = query(clientsRef, orderByChild('idNumber'), equalTo(body.idNumber));
    const snapshot = await get(idQuery);

    if (snapshot.exists()) {
      // Double check not deleted
      let exists = false;
      snapshot.forEach(c => {
        if (!c.val().deletedAt) exists = true;
      });
      if (exists) {
        return NextResponse.json(
          { error: "A client with this ID number already exists" },
          { status: 400 }
        );
      }
    }

    const newClient = {
      clientNumber,
      title: body.title,
      firstName: body.firstName,
      middleName: body.middleName || "",
      lastName: body.lastName,
      idNumber: body.idNumber,
      dateOfBirth: new Date(body.dateOfBirth).toISOString(),
      gender: body.gender,
      maritalStatus: body.maritalStatus,
      phone: body.phone,
      altPhone: body.altPhone || "",
      email: body.email || "",
      streetAddress: body.streetAddress,
      suburb: body.suburb,
      city: body.city,
      province: body.province,
      postalCode: body.postalCode,
      country: body.country || "South Africa",
      occupation: body.occupation || "",
      employer: body.employer || "",
      employerAddress: body.employerAddress || "",
      bankName: body.bankName || "",
      accountNumber: body.accountNumber || "",
      branchCode: body.branchCode || "",
      accountType: body.accountType || "",
      createdAt: new Date().toISOString(),
      createdBy: user.userId,
      isActive: true
    };

    const newClientRef = push(clientsRef);
    await set(newClientRef, sanitizeForFirebase(newClient));

    await createAuditLog(
      user.userId,
      "CREATE",
      "client",
      newClientRef.key!,
      "Client",
      null,
      newClient,
      `Created new client: ${newClient.firstName} ${newClient.lastName}`
    );

    return NextResponse.json({ client: { id: newClientRef.key, ...newClient } }, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}

// Needed imports for set
import { set } from "firebase/database";
