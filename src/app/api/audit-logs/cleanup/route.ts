import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, query, orderByChild, startAt, endAt, update } from "firebase/database";
import { getCurrentUser, createAuditLog } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        // Only DIRECTOR can clear logs
        if (!user || user.role !== "DIRECTOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { startDate, endDate } = body;

        if (!startDate || !endDate) {
            return NextResponse.json({ error: "Start and end dates are required" }, { status: 400 });
        }

        const logsRef = ref(db, 'auditLogs');
        const logsQuery = query(
            logsRef,
            orderByChild('createdAt'),
            startAt(new Date(startDate).toISOString()),
            endAt(new Date(endDate).toISOString())
        );

        const snapshot = await get(logsQuery);
        
        if (!snapshot.exists()) {
            return NextResponse.json({ message: "No logs found in the specified range", count: 0 });
        }

        const updates: Record<string, null> = {};
        let count = 0;
        
        snapshot.forEach((child) => {
            updates[child.key!] = null;
            count++;
        });

        await update(logsRef, updates);

        // Log the cleanup action itself
        await createAuditLog(
            user.userId,
            "DELETE",
            "audit-logs",
            "SYSTEM",
            "AuditLogs",
            null,
            null,
            `Cleared ${count} audit logs from ${startDate} to ${endDate}`
        );

        return NextResponse.json({ success: true, count });
    } catch (error) {
        console.error("Error clearing audit logs:", error);
        return NextResponse.json(
            { error: "Failed to clear audit logs" },
            { status: 500 }
        );
    }
}
