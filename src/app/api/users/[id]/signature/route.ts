import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, update } from "firebase/database";
import { getCurrentUser, createAuditLog } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const currentUser = await getCurrentUser();
    
    if (!currentUser || !["ADMIN", "DIRECTOR"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { signature } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const userRef = ref(db, `users/${userId}`);
    await update(userRef, { signature });

    await createAuditLog(
      currentUser.userId,
      "UPDATE",
      "user",
      userId,
      "User Signature",
      { signature: "old_signature" }, // Simplified
      { signature },
      `Updated signature for user ID: ${userId}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating signature:", error);
    return NextResponse.json({ error: "Failed to update signature" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const currentUser = await getCurrentUser();
    if (!currentUser || !["ADMIN", "DIRECTOR"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRef = ref(db, `users/${userId}`);
    await update(userRef, { signature: null });

    await createAuditLog(
      currentUser.userId,
      "DELETE",
      "user",
      userId,
      "User Signature",
      null,
      null,
      `Removed signature for user ID: ${userId}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing signature:", error);
    return NextResponse.json({ error: "Failed to remove signature" }, { status: 500 });
  }
}
