import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@royaltyfuneral.co.za", password: "admin123" })
    });
    const text = await res.text();
    return NextResponse.json({ status: res.status, headers: Object.fromEntries(res.headers.entries()), text });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}

