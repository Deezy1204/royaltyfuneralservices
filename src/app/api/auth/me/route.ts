import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserById } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { ref, update, child } from "firebase/database";
import { sanitizeForFirebase } from "@/lib/utils";

export async function GET() {
  try {
    const payload = await getCurrentUser();

    if (!payload) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await getUserById(payload.userId);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await getCurrentUser();
    if (!payload) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const updates: Record<string, any> = {};
    if (body.firstName !== undefined) updates.firstName = body.firstName;
    if (body.lastName !== undefined) updates.lastName = body.lastName;
    if (body.phone !== undefined) updates.phone = body.phone;
    updates.updatedAt = new Date().toISOString();

    await update(child(ref(db), `users/${payload.userId}`), sanitizeForFirebase(updates));

    const updatedUser = await getUserById(payload.userId);
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
