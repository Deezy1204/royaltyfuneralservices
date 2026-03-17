
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, push, set, query, orderByChild, equalTo } from "firebase/database";
import { getCurrentUser, hashPassword, createAuditLog } from "@/lib/auth";
import { sanitizeForFirebase } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    const usersRef = ref(db, 'users');
    const [usersSnapshot, loginHistorySnapshot] = await Promise.all([
      get(usersRef),
      get(ref(db, 'loginHistory'))
    ]);

    const lastLogins: Record<string, string> = {};
    if (loginHistorySnapshot.exists()) {
      loginHistorySnapshot.forEach(child => {
        const entry = child.val();
        if (entry.success && entry.userId) {
          if (!lastLogins[entry.userId] || new Date(entry.timestamp) > new Date(lastLogins[entry.userId])) {
            lastLogins[entry.userId] = entry.timestamp;
          }
        }
      });
    }

    let users: any[] = [];
    if (usersSnapshot.exists()) {
      usersSnapshot.forEach((childSnapshot) => {
        const u = childSnapshot.val();
        users.push({
          id: childSnapshot.key,
          ...u,
          lastLogin: lastLogins[childSnapshot.key] || u.lastLogin || null
        });
      });
    }

    // Filter
    users = users.filter(u => !u.deletedAt);

    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(u =>
        (u.firstName && u.firstName.toLowerCase().includes(searchLower)) ||
        (u.lastName && u.lastName.toLowerCase().includes(searchLower)) ||
        (u.email && u.email.toLowerCase().includes(searchLower))
      );
    }

    // Sort
    users.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const email = body.email.toLowerCase();

    // Check existing
    const usersRef = ref(db, 'users');
    const emailQuery = query(usersRef, orderByChild('email'), equalTo(email));
    const snapshot = await get(emailQuery);

    if (snapshot.exists()) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(body.password);

    const checkRootQuery = query(usersRef);
    // Manual scan fallback if index fails in dev
    // Not needed if the above worked, but let's trust query for now or handle scan locally if needed.
    // The previous get(emailQuery) is sufficient if rules index it, but locally it works fine usually on small data.

    const newUser = {
      email: email,
      password: hashedPassword,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      role: body.role,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const newUserRef = push(usersRef);
    await set(newUserRef, sanitizeForFirebase(newUser));
    const userId = newUserRef.key;

    await createAuditLog(
      currentUser.userId,
      "CREATE",
      "user",
      userId!,
      "User",
      null,
      newUser,
      `Created user: ${newUser.firstName} ${newUser.lastName}`
    );

    return NextResponse.json({ user: { id: userId, ...newUser } }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
