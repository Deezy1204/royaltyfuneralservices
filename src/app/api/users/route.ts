
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
    if (!currentUser || !["ADMIN", "DIRECTOR"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const email = body.email.toLowerCase();

    // Enforce role creation limits
    if (currentUser.role === "ADMIN" && (body.role === "DIRECTOR" || body.role === "ADMIN")) {
      return NextResponse.json({ error: "Insufficient permissions to create Admin or Director accounts" }, { status: 403 });
    }

    // Check existing (manual scan to avoid index error)
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    let emailExists = false;

    if (snapshot.exists()) {
      snapshot.forEach(child => {
        const u = child.val();
        if (u.email && u.email.toLowerCase() === email) {
          emailExists = true;
        }
      });
    }

    if (emailExists) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(body.password);

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
