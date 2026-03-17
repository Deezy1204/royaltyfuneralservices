
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, push, set, get } from "firebase/database";
import { getCurrentUser } from "@/lib/auth";
import { sanitizeForFirebase } from "@/lib/utils";

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const declarationsRef = ref(db, 'declarations');
        const snapshot = await get(declarationsRef);
        let declarations: any[] = [];

        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                declarations.push({ id: childSnapshot.key, ...childSnapshot.val() });
            });
        }

        // Sort by newest first
        declarations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ declarations });
    } catch (error) {
        console.error("Error fetching declarations:", error);
        return NextResponse.json(
            { error: "Failed to fetch declarations" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Get current user if possible, or fallback
        const user = await getCurrentUser();
        const createdById = user ? user.userId : (body.createdById || "system");

        const declaration = {
            ...body,
            declarationNumber: `DEC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`,
            createdById: createdById,
            createdAt: new Date().toISOString()
        };

        const declRef = ref(db, 'declarations');
        const newDeclRef = push(declRef);
        await set(newDeclRef, sanitizeForFirebase(declaration));

        return NextResponse.json({
            declaration: { id: newDeclRef.key, ...declaration }
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating declaration:", error);
        return NextResponse.json(
            { error: "Failed to create declaration" },
            { status: 500 }
        );
    }
}
