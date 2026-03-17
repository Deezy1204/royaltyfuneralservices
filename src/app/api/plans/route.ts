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
            return NextResponse.json({ plans: [] });
        }

        const plansData = plansSnap.val();
        const plansList = Object.keys(plansData).map(key => ({
            id: key,
            ...plansData[key]
        })).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

        return NextResponse.json({ plans: plansList });
    } catch (error) {
        console.error("Error fetching plans:", error);
        return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
    }
}
