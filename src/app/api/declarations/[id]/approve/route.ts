import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, child, update } from "firebase/database";
import { getCurrentUser, createAuditLog } from "@/lib/auth";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const newStatus = body.status; // "APPROVED" or "REJECTED"

        if (!["APPROVED", "REJECTED"].includes(newStatus)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const decRef = child(ref(db), `declarations/${id}`);
        const decSnap = await get(decRef);
        if (!decSnap.exists()) {
            return NextResponse.json({ error: "Declaration not found" }, { status: 404 });
        }
        
        const existing = decSnap.val();
        const now = new Date().toISOString();
        const declarationUpdates: any = { status: newStatus };
        if (newStatus === "APPROVED") {
            declarationUpdates.approvedAt = now;
            declarationUpdates.approvedById = user.userId;
        } else {
            declarationUpdates.rejectedAt = now;
            declarationUpdates.rejectedById = user.userId;
        }
        await update(decRef, declarationUpdates);

        // Audit Log for Declaration
        await createAuditLog(
            user.userId,
            "UPDATE",
            "declaration",
            id,
            "Declaration",
            existing,
            { ...existing, status: newStatus },
            `${newStatus === "APPROVED" ? "Approved" : "Rejected"} declaration ${existing.declarationNumber}`
        );

        // Find associated claim and update it (in-memory filter to avoid missing index error)
        const allClaimsSnap = await get(ref(db, 'claims'));

        if (allClaimsSnap.exists()) {
            const updates: any = {};
            allClaimsSnap.forEach((childSnapshot) => {
                const claim = childSnapshot.val();
                if (claim.declarationId !== id) return;
                
                const claimId = childSnapshot.key;
                
                updates[`${claimId}/status`] = newStatus === "APPROVED" ? "PAID" : "REJECTED";
                
                if (newStatus === "APPROVED") {
                    updates[`${claimId}/approvedAt`] = now;
                    updates[`${claimId}/paidAt`] = now;
                    updates[`${claimId}/approvedBy`] = {
                        userId: user.userId,
                        firstName: user.firstName,
                        lastName: user.lastName
                    };
                } else {
                    updates[`${claimId}/rejectedAt`] = now;
                    updates[`${claimId}/rejectionReason`] = "Declaration rejected by admin";
                }
            });
            if (Object.keys(updates).length > 0) {
                await update(ref(db, 'claims'), updates);
            }
        }

        return NextResponse.json({ success: true, status: newStatus });
    } catch (error) {
        console.error("Error updating declaration status:", error);
        return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }
}
