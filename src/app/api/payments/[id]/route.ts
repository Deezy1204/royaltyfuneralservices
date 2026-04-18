
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, child, update } from "firebase/database";
import { getCurrentUser, createAuditLog } from "@/lib/auth";

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
        const paymentSnap = await get(child(ref(db), `payments/${id}`));

        if (!paymentSnap.exists()) {
            return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        }

        const payment = { id, ...paymentSnap.val() };

        // Enhance with client and policy info
        let client = null;
        let policy = null;

        if (payment.clientId) {
            const clientSnap = await get(child(ref(db), `clients/${payment.clientId}`));
            if (clientSnap.exists()) client = { id: payment.clientId, ...clientSnap.val() };
        }

        if (payment.policyId) {
            const policySnap = await get(child(ref(db), `policies/${payment.policyId}`));
            if (policySnap.exists()) policy = { id: payment.policyId, ...policySnap.val() };
        }

        return NextResponse.json({
            payment: {
                ...payment,
                client,
                policy
            }
        });
    } catch (error) {
        console.error("Error fetching payment:", error);
        return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "ADMIN" && user.role !== "DIRECTOR" && user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        
        if (body.status === "CONFIRMED") {
            const paymentSnap = await get(child(ref(db), `payments/${id}`));
            if (!paymentSnap.exists()) {
                return NextResponse.json({ error: "Payment not found" }, { status: 404 });
            }
            
            const payment = paymentSnap.val();
            
            // Update payment
            await update(child(ref(db), `payments/${id}`), {
                status: "CONFIRMED",
                confirmedAt: new Date().toISOString(),
                confirmedById: user.userId
            });
            
            // Update policy
            if (payment.policyId) {
                const policyRef = child(ref(db), `policies/${payment.policyId}`);
                await update(policyRef, {
                    lastPaymentDate: payment.paymentDate
                });
            }
            
            await createAuditLog(
                user.userId,
                "UPDATE",
                "payment",
                id,
                "Payment",
                payment,
                { ...payment, status: "CONFIRMED" },
                `Confirmed payment ${payment.paymentNumber}`
            );
            
            return NextResponse.json({ success: true });
        }
        
        return NextResponse.json({ error: "Invalid status update" }, { status: 400 });
    } catch (error) {
        console.error("Error updating payment:", error);
        return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
    }
}
