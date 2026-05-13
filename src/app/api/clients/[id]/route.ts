
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, set, remove, child, update } from "firebase/database";
import { getCurrentUser, createAuditLog } from "@/lib/auth";
import { sanitizeForFirebase, generateDiffDescription } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    // Check regular clients first
    let clientSnap = await get(child(ref(db), `clients/${id}`));
    let isOld = false;
    
    if (!clientSnap.exists() || clientSnap.val().deletedAt) {
      // Check old clients
      clientSnap = await get(child(ref(db), `OldClients/${id}`));
      isOld = true;
    }

    if (!clientSnap.exists() || clientSnap.val().deletedAt) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const clientData = { id, ...clientSnap.val(), isOldClient: isOld || clientSnap.val().isOldClient };

    // Fetch agent info
    let agent = null;
    const agentId = clientData.agentId || clientData.createdBy;
    if (agentId) {
      const agentSnap = await get(child(ref(db), `users/${agentId}`));
      if (agentSnap.exists()) {
        const aData = agentSnap.val();
        if (!aData.deletedAt && aData.isActive) {
          agent = { firstName: aData.firstName, lastName: aData.lastName, userId: aData.userId };
        }
      }
    }

    if (!agent) {
      agent = { firstName: "System", lastName: "Administrator", userId: "admin" };
    }

    // Fetch policies for this client
    const policyCollections = ["policies", "OldPolicies"];
    const policies: any[] = [];
    
    for (const col of policyCollections) {
      const snap = await get(ref(db, col));
      if (snap.exists()) {
        snap.forEach((child) => {
          const pol = child.val();
          if (!pol.deletedAt && pol.clientId === id) {
            policies.push({ id: child.key, ...pol });
          }
        });
      }
    }

    // Fetch claims for this client
    const claimCollections = ["claims", "OldClaims"];
    const claims: any[] = [];
    
    for (const col of claimCollections) {
      const snap = await get(ref(db, col));
      if (snap.exists()) {
        snap.forEach((child) => {
          const claim = child.val();
          if (!claim.deletedAt && claim.clientId === id) {
            claims.push({ id: child.key, ...claim });
          }
        });
      }
    }

    // Fetch payments for this client
    const paymentCollections = ["payments", "OldPayments"];
    const payments: any[] = [];
    
    for (const col of paymentCollections) {
      const snap = await get(ref(db, col));
      if (snap.exists()) {
        snap.forEach((child) => {
          const payment = child.val();
          if (!payment.deletedAt && payment.clientId === id) {
            payments.push({ id: child.key, ...payment });
          }
        });
      }
    }

    return NextResponse.json({
      client: { ...clientData, agent, policies, claims, payments },
    });
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    let clientSnap = await get(child(ref(db), `clients/${id}`));
    let collectionPath = `clients/${id}`;
    let isOld = false;

    if (!clientSnap.exists() || clientSnap.val().deletedAt) {
      clientSnap = await get(child(ref(db), `OldClients/${id}`));
      collectionPath = `OldClients/${id}`;
      isOld = true;
    }

    if (!clientSnap.exists() || clientSnap.val().deletedAt) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const previousData = clientSnap.val();
    const body = await request.json();

    const updatedClient = {
      ...previousData,
      title: body.title ?? previousData.title,
      firstName: body.firstName ?? previousData.firstName,
      middleName: body.middleName ?? previousData.middleName,
      lastName: body.lastName ?? previousData.lastName,
      idNumber: body.idNumber ?? previousData.idNumber,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth).toISOString() : previousData.dateOfBirth,
      gender: body.gender ?? previousData.gender,
      maritalStatus: body.maritalStatus ?? previousData.maritalStatus,
      phone: body.phone ?? previousData.phone,
      altPhone: body.altPhone ?? previousData.altPhone,
      email: body.email ?? previousData.email,
      address: body.address ?? previousData.address,
      streetAddress: body.streetAddress ?? body.address ?? previousData.streetAddress,
      suburb: body.suburb ?? previousData.suburb,
      city: body.city ?? previousData.city,
      province: body.province ?? previousData.province,
      postalCode: body.postalCode ?? previousData.postalCode,
      country: body.country ?? previousData.country,
      occupation: body.occupation ?? previousData.occupation,
      employer: body.employer ?? previousData.employer,
      employerAddress: body.employerAddress ?? previousData.employerAddress,
      bankName: body.bankName ?? previousData.bankName,
      accountNumber: body.accountNumber ?? previousData.accountNumber,
      branchCode: body.branchCode ?? previousData.branchCode,
      accountType: body.accountType ?? previousData.accountType,
      isActive: body.isActive !== undefined ? body.isActive : previousData.isActive,
      updatedAt: new Date().toISOString(),
      updatedBy: user.userId,
    };

    const updates: any = {};
    updates[collectionPath] = sanitizeForFirebase(updatedClient);

    const clientName = `${previousData.firstName} ${previousData.lastName}`;
    const performerName = `${user.firstName} ${user.lastName}`;

    // If policy update requested
    if (body.policyId) {
      let polRef = child(ref(db), `policies/${body.policyId}`);
      let polSnap = await get(polRef);
      let polPath = `policies/${body.policyId}`;

      if (!polSnap.exists() || polSnap.val().deletedAt) {
        polRef = child(ref(db), `OldPolicies/${body.policyId}`);
        polSnap = await get(polRef);
        polPath = `OldPolicies/${body.policyId}`;
      }

      if (polSnap.exists()) {
        const previousPolicy = polSnap.val();
        const updatedPolicy = {
          ...previousPolicy,
          planType: body.planType ?? previousPolicy.planType,
          planServiceType: body.planServiceType ?? previousPolicy.planServiceType,
          paymentFrequency: body.paymentFrequency ?? previousPolicy.paymentFrequency,
          premiumAmount: body.premiumAmount !== undefined ? Number(body.premiumAmount) : previousPolicy.premiumAmount,
          status: body.status ?? previousPolicy.status,
          paymentMethod: body.paymentMethod ?? previousPolicy.paymentMethod,
          notes: body.notes ?? previousPolicy.notes,
          updatedAt: new Date().toISOString(),
          updatedBy: user.userId,
        };
        updates[polPath] = sanitizeForFirebase(updatedPolicy);

        const policyDiff = generateDiffDescription(previousPolicy, updatedPolicy, {
          planType: "Plan Type",
          planServiceType: "Service Type",
          premiumAmount: "Premium Amount",
          status: "Policy Status",
          paymentFrequency: "Payment Frequency"
        });

        await createAuditLog(
          user.userId, "UPDATE", "policy", body.policyId, "Policy",
          previousPolicy, updatedPolicy, 
          `${performerName} updated policy ${previousPolicy.policyNumber} (Client: ${clientName}): ${policyDiff}`
        );
      }
    }

    await update(ref(db), updates);

    const clientDiff = generateDiffDescription(previousData, updatedClient, {
      firstName: "First Name",
      lastName: "Last Name",
      idNumber: "ID Number",
      phone: "Phone",
      address: "Address",
      streetAddress: "Street Address",
      isActive: "Active Status",
      planType: "Plan Type",
      premiumAmount: "Premium Amount"
    });

    await createAuditLog(
      user.userId,
      "UPDATE",
      "client",
      id,
      "Client",
      previousData,
      updatedClient,
      `${performerName} updated client ${clientName}: ${clientDiff}`
    );

    return NextResponse.json({ client: { id, ...updatedClient } });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    let clientSnap = await get(child(ref(db), `clients/${id}`));
    let collectionPath = `clients/${id}`;

    if (!clientSnap.exists()) {
      clientSnap = await get(child(ref(db), `OldClients/${id}`));
      collectionPath = `OldClients/${id}`;
    }

    if (!clientSnap.exists()) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Soft delete
    const existing = clientSnap.val();
    await set(ref(db, collectionPath), sanitizeForFirebase({
      ...existing,
      deletedAt: new Date().toISOString(),
      deletedBy: user.userId,
      isActive: false,
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}
