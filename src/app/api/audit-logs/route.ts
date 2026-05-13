import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        // Allow ADMIN and DIRECTOR to view audit logs
        if (!user || !["ADMIN", "DIRECTOR", "GENERAL_MANAGER"].includes(user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const logsRef = ref(db, 'auditLogs');
        const snapshot = await get(logsRef);
        let logs: any[] = [];

        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const log = childSnapshot.val();
                logs.push({ id: childSnapshot.key, ...log });
            });
        }

        // Fetch users to map user ID to username
        const usersRef = ref(db, 'users');
        const usersSnap = await get(usersRef);
        const usersMap: Record<string, string> = {};
        if (usersSnap.exists()) {
            usersSnap.forEach((u) => {
                const userData = u.val();
                usersMap[u.key] = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
            });
        }

        // Enhance logs with username and ensure createdAt is present
        logs = logs.map(log => ({
            ...log,
            username: usersMap[log.userId] || "Unknown User",
            createdAt: log.createdAt || log.timestamp // fallback to timestamp if needed
        }));

        // Sort by newest first
        logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ logs });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return NextResponse.json(
            { error: "Failed to fetch audit logs" },
            { status: 500 }
        );
    }
}
