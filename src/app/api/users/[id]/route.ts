import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, update, remove } from "firebase/database";
import { getCurrentUser, createAuditLog } from "@/lib/auth";
import { sanitizeForFirebase } from "@/lib/utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    
    if (!currentUser || !["ADMIN", "DIRECTOR"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const userRef = ref(db, `users/${id}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingUser = snapshot.val();

    // Access control:
    // DIRECTOR can edit any user.
    // ADMIN can edit users except ADMIN and DIRECTOR.
    if (currentUser.role === "ADMIN") {
      if (existingUser.role === "DIRECTOR" || existingUser.role === "ADMIN") {
        return NextResponse.json({ error: "Cannot edit Admin or Director accounts" }, { status: 403 });
      }
      if (body.role === "DIRECTOR" || body.role === "ADMIN") {
        return NextResponse.json({ error: "Cannot elevate account to Admin or Director" }, { status: 403 });
      }
    }

    const updates: any = {};
    if (body.firstName) updates.firstName = body.firstName;
    if (body.lastName) updates.lastName = body.lastName;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.role) updates.role = body.role;
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    await update(userRef, sanitizeForFirebase(updates));

    await createAuditLog(
      currentUser.userId,
      "UPDATE",
      "user",
      id,
      "User",
      existingUser,
      { ...existingUser, ...updates },
      `Updated user: ${updates.firstName || existingUser.firstName}`
    );

    return NextResponse.json({ user: { id, ...existingUser, ...updates } });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    
    // Only DIRECTOR can delete users, or ADMINs can delete non-DIRECTOR users.
    if (!currentUser || !["ADMIN", "DIRECTOR"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Don't allow self-deletion via this route easily
    if (currentUser.userId === id) {
       return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    const userRef = ref(db, `users/${id}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingUser = snapshot.val();

    if (currentUser.role === "ADMIN" && (existingUser.role === "DIRECTOR" || existingUser.role === "ADMIN")) {
      return NextResponse.json({ error: "Cannot delete Admin or Director accounts" }, { status: 403 });
    }

    // Soft delete to preserve referential integrity
    await update(userRef, { deletedAt: new Date().toISOString(), isActive: false });

    await createAuditLog(
      currentUser.userId,
      "DELETE",
      "user",
      id,
      "User",
      existingUser,
      { deletedAt: new Date().toISOString(), isActive: false },
      `Deleted user: ${existingUser.firstName} ${existingUser.lastName}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
