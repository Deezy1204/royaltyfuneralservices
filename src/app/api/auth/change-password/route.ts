import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyPassword, hashPassword } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { ref, get, update, child } from "firebase/database";
import { sanitizeForFirebase } from "@/lib/utils";

export async function POST(request: NextRequest) {
    try {
        const payload = await getCurrentUser();
        if (!payload) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Both current and new password are required" }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
        }

        // Get user from DB
        const userSnap = await get(child(ref(db), `users/${payload.userId}`));
        if (!userSnap.exists()) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userData = userSnap.val();
        const isValid = await verifyPassword(currentPassword, userData.password);
        if (!isValid) {
            return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
        }

        const newHashedPassword = await hashPassword(newPassword);
        await update(child(ref(db), `users/${payload.userId}`), sanitizeForFirebase({
            password: newHashedPassword,
            updatedAt: new Date().toISOString(),
        }));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Change password error:", error);
        return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
    }
}
