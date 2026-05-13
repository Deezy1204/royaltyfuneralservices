import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, update, remove } from "firebase/database";
import { getCurrentUser, createAuditLog } from "@/lib/auth";
import { sanitizeForFirebase, generateDiffDescription } from "@/lib/utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    
    if (!currentUser || !["ADMIN", "DIRECTOR", "GENERAL_MANAGER"].includes(currentUser.role)) {
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
    // ADMIN and GENERAL_MANAGER can edit users except ADMIN, DIRECTOR, and GENERAL_MANAGER.
    if (["ADMIN", "GENERAL_MANAGER"].includes(currentUser.role)) {
      if (["DIRECTOR", "ADMIN", "GENERAL_MANAGER"].includes(existingUser.role)) {
        return NextResponse.json({ error: "Cannot edit high-level accounts" }, { status: 403 });
      }
      if (["DIRECTOR", "ADMIN", "GENERAL_MANAGER"].includes(body.role)) {
        return NextResponse.json({ error: "Cannot elevate account to high-level role" }, { status: 403 });
      }
    }

    const updates: any = {};
    if (body.firstName) updates.firstName = body.firstName;
    if (body.lastName) updates.lastName = body.lastName;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.role) updates.role = body.role;
    if (body.joiningDate !== undefined) updates.joiningDate = body.joiningDate;
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    await update(userRef, sanitizeForFirebase(updates));

    const diff = generateDiffDescription(existingUser, updates, {
      firstName: "First Name",
      lastName: "Last Name",
      phone: "Phone",
      role: "Role",
      isActive: "Account Status",
      joiningDate: "Joining Date"
    });

    const userName = `${existingUser.firstName} ${existingUser.lastName}`;
    const performerName = `${currentUser.firstName} ${currentUser.lastName}`;

    await createAuditLog(
      currentUser.userId,
      "UPDATE",
      "user",
      id,
      "User",
      existingUser,
      { ...existingUser, ...updates },
      `${performerName} updated user ${userName}: ${diff}`
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
    
    // Only DIRECTOR can delete users, or ADMINs/GMs can delete non-high-level users.
    if (!currentUser || !["ADMIN", "DIRECTOR", "GENERAL_MANAGER"].includes(currentUser.role)) {
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

    if (["ADMIN", "GENERAL_MANAGER"].includes(currentUser.role) && ["DIRECTOR", "ADMIN", "GENERAL_MANAGER"].includes(existingUser.role)) {
      return NextResponse.json({ error: "Cannot delete high-level accounts" }, { status: 403 });
    }

    // Soft delete to preserve referential integrity
    await update(userRef, { deletedAt: new Date().toISOString(), isActive: false });

    // Re-assign clients of this agent to the admin performing the deletion
    const clientsSnap = await get(ref(db, "clients"));
    if (clientsSnap.exists()) {
      const updatesToClients: any = {};
      clientsSnap.forEach((child) => {
        const client = child.val();
        if (client.createdBy === id || client.agentId === id) {
          updatesToClients[`clients/${child.key}/createdBy`] = currentUser.userId;
          updatesToClients[`clients/${child.key}/agentId`] = currentUser.userId;
        }
      });
      if (Object.keys(updatesToClients).length > 0) {
        await update(ref(db), updatesToClients);
      }
    }

    const userName = `${existingUser.firstName} ${existingUser.lastName}`;
    const performerName = `${currentUser.firstName} ${currentUser.lastName}`;

    await createAuditLog(
      currentUser.userId,
      "DELETE",
      "user",
      id,
      "User",
      existingUser,
      { deletedAt: new Date().toISOString(), isActive: false },
      `${performerName} deleted user: ${userName}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
