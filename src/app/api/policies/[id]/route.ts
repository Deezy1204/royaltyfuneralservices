import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, child, update } from "firebase/database";
import { getCurrentUser, createAuditLog } from "@/lib/auth";
import { sanitizeForFirebase } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    let polRef = child(ref(db), `policies/${id}`);
    let polSnap = await get(polRef);
    let isOld = false;
    
    if (!polSnap.exists()) {
      polRef = child(ref(db), `OldPolicies/${id}`);
      polSnap = await get(polRef);
      isOld = true;
    }
    
    if (!polSnap.exists()) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    return NextResponse.json({ policy: { id, ...polSnap.val(), isOldPolicy: isOld } });
  } catch (error) {
    console.error("Error fetching policy:", error);
    return NextResponse.json({ error: "Failed to fetch policy" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    let polRef = child(ref(db), `policies/${id}`);
    let polSnap = await get(polRef);
    
    if (!polSnap.exists()) {
      polRef = child(ref(db), `OldPolicies/${id}`);
      polSnap = await get(polRef);
    }

    if (!polSnap.exists()) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    const previous = polSnap.val();
    const updates = {
      ...body,
      updatedAt: new Date().toISOString(),
      updatedBy: user.userId,
    };

    await update(polRef, sanitizeForFirebase(updates));

    await createAuditLog(
      user.userId,
      "UPDATE",
      "policy",
      id,
      "Policy",
      previous,
      { ...previous, ...updates },
      `Updated policy ${previous.policyNumber} - Status: ${updates.status || previous.status}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating policy:", error);
    return NextResponse.json({ error: "Failed to update policy" }, { status: 500 });
  }
}
