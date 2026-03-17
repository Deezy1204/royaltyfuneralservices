import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, child, update, query, orderByChild, equalTo } from "firebase/database";
import { getCurrentUser, createAuditLog } from "@/lib/auth";
import { sanitizeForFirebase } from "@/lib/utils";

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

        const decSnap = await get(child(ref(db), `declarations/${id}`));
        if (!decSnap.exists()) {
            return NextResponse.json({ error: "Declaration not found" }, { status: 404 });
        }
        const declarationData = decSnap.val();

        // Fetch related client and policies
        let client: any = {};
        if (declarationData.clientId) {
            const clientSnap = await get(child(ref(db), `clients/${declarationData.clientId}`));
            if (clientSnap.exists()) {
                client = clientSnap.val();
                
                // Fetch policies for this client to determine Waiting Period (in-memory filter to avoid index error)
                const policiesSnap = await get(ref(db, 'policies'));
                client.policies = [];
                if (policiesSnap.exists()) {
                    policiesSnap.forEach(p => {
                        const policy = p.val();
                        if (policy.clientId === declarationData.clientId) {
                            client.policies.push({ id: p.key, ...policy });
                        }
                    });
                }
            }
        }

        return NextResponse.json({ declaration: { id, ...declarationData, client } });
    } catch (error) {
        console.error("Error fetching declaration:", error);
        return NextResponse.json({ error: "Failed to fetch declaration" }, { status: 500 });
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
        const body = await request.json();

        const decRef = child(ref(db), `declarations/${id}`);
        const decSnap = await get(decRef);
        if (!decSnap.exists()) {
            return NextResponse.json({ error: "Declaration not found" }, { status: 404 });
        }
        const existing = decSnap.val();

        await update(decRef, sanitizeForFirebase(body));

        await createAuditLog(
            user.userId,
            "UPDATE",
            "declaration",
            id,
            "Declaration",
            existing,
            { ...existing, ...body },
            `Updated declaration ${existing.declarationNumber}`
        );

        return NextResponse.json({ declaration: { id, ...existing, ...body } });
    } catch (error) {
        console.error("Error updating declaration:", error);
        return NextResponse.json({ error: "Failed to update declaration" }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });

        const { id } = await params;
        const decSnap = await get(child(ref(db), `declarations/${id}`));
        if (!decSnap.exists()) return NextResponse.json({ error: "Declaration not found" }, { status: 404 });

        const existing = decSnap.val();
        // Soft delete
        await update(child(ref(db), `declarations/${id}`), { deletedAt: new Date().toISOString(), deletedBy: user.userId });

        await createAuditLog(
            user.userId, "DELETE", "declaration", id, "Declaration", existing, null,
            `Deleted declaration ${existing.declarationNumber}`
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting declaration:", error);
        return NextResponse.json({ error: "Failed to delete declaration" }, { status: 500 });
    }
}
