
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, push } from "firebase/database";
import { hashPassword, JWTPayload, generateToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, firstName, lastName, role, phone } = body;

        // 1. Basic Validation
        if (!email || !password || !firstName || !lastName) {
            return NextResponse.json(
                { error: "Missing required fields: email, password, firstName, lastName" },
                { status: 400 }
            );
        }

        // 2. Normalize email
        const normalizedEmail = email.toLowerCase();

        // 3. Check if user already exists (client-side filter to avoid needing an RTDB index)
        const usersRef = ref(db, "users");
        const snapshot = await get(usersRef);

        if (snapshot.exists()) {
            const users = snapshot.val();
            const existingUser = Object.values(users).find(
                (user: unknown) => (user as { email: string }).email === normalizedEmail
            );
            if (existingUser) {
                return NextResponse.json(
                    { error: "User with this email already exists" },
                    { status: 400 }
                );
            }
        }

        // 4. Hash password
        const hashedPassword = await hashPassword(password);

        // 5. Create User Object
        const newUser = {
            email: normalizedEmail,
            password: hashedPassword,
            firstName,
            lastName,
            // Default to AGENT if not specified, or allow setting if admin/secured (simplified here)
            role: role || "AGENT",
            phone: phone || "",
            isActive: true,
            createdAt: new Date().toISOString(),
        };

        // 6. Save to DB
        const newUserRef = await push(usersRef, newUser);
        const userId = newUserRef.key;

        if (!userId) {
            throw new Error("Failed to generate user ID");
        }

        // 7. Generate Token (Auto-login after signup)
        const tokenPayload: JWTPayload = {
            userId,
            email: newUser.email,
            role: newUser.role,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
        };

        const token = generateToken(tokenPayload);

        // 8. Set auth cookie (same as login route)
        const cookieStore = await cookies();
        cookieStore.set("auth-token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        // 9. Return Success
        // Exclude password from response
        const { password: _, ...userWithoutPassword } = newUser;

        return NextResponse.json({
            message: "User created successfully",
            user: { id: userId, ...userWithoutPassword },
        }, { status: 201 });

    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
