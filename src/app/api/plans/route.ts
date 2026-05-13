import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const plansSnap = await get(ref(db, "plans"));
        if (!plansSnap.exists()) {
            return NextResponse.json({ plans: {} });
        }

        const plansData = plansSnap.val();
        return NextResponse.json({ plans: plansData });
    } catch (error) {
        console.error("Error fetching plans:", error);
        return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        // Allow ONLY Admins or Directors to update plan configuration
        if (!user || !["ADMIN", "DIRECTOR", "GENERAL_MANAGER"].includes(user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // Overwrite the entire 'plans' node with the new configuration
        // Using set from firebase/database to completely replace
        const { set } = await import("firebase/database");
        await set(ref(db, "plans"), body);

        return NextResponse.json({ success: true, plans: body });
    } catch (error) {
        console.error("Error updating plans:", error);
        return NextResponse.json({ error: "Failed to update plans" }, { status: 500 });
    }
}
