import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, set, push } from "firebase/database";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = (await getCurrentUser()) as any;
    if (!user || (user.role !== "DIRECTOR" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const month = parseInt(searchParams.get("month") || new Date().getMonth().toString());
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    // 1. Fetch all agents
    const usersSnap = await get(ref(db, "users"));
    const agents: any[] = [];
    if (usersSnap.exists()) {
      usersSnap.forEach((childSnapshot) => {
        const u = childSnapshot.val();
        if (u.role === "AGENT" && !u.deletedAt) {
          agents.push({ id: childSnapshot.key, ...u });
        }
      });
    }

    // 2. Fetch all clients
    const clientsSnap = await get(ref(db, "clients"));
    const clients: any[] = [];
    if (clientsSnap.exists()) {
      clientsSnap.forEach((childSnapshot) => {
        const c = childSnapshot.val();
        if (!c.deletedAt) {
          clients.push({ id: childSnapshot.key, ...c });
        }
      });
    }

    // 3. Fetch all payments
    const paymentsSnap = await get(ref(db, "payments"));
    const payments: any[] = [];
    if (paymentsSnap.exists()) {
      paymentsSnap.forEach((childSnapshot) => {
        const p = childSnapshot.val();
        if (!p.deletedAt && p.status === "CONFIRMED") {
          payments.push({ id: childSnapshot.key, ...p });
        }
      });
    }

    // 4. Fetch commission payments (to check if already paid)
    const paidSnap = await get(ref(db, `commissionPayments/${year}/${month}`));
    const paidAgents = paidSnap.exists() ? Object.keys(paidSnap.val()) : [];

    const currentDate = new Date();

    // Group clients by agent
    const agentCommissions = agents.map(agent => {
      // Determine agent commission rate based on tenure
      const agentCreatedAt = agent.createdAt ? new Date(agent.createdAt) : new Date();
      const differenceInYears = (currentDate.getTime() - agentCreatedAt.getTime()) / (1000 * 3600 * 24 * 365);
      const commissionRate = differenceInYears < 1 ? 0.20 : 0.10;

      const agentClients = clients.filter(c => c.createdById === agent.id || c.assignedAgentId === agent.id);

      let totalPremiums = 0;
      let totalCommission = 0;

      const clientDetails = agentClients.map(client => {
        const clientPayments = payments.filter(p => {
          if (p.clientId !== client.id) return false;
          if (!p.paymentDate) return false;
          const pDate = new Date(p.paymentDate);
          return pDate.getMonth() === month && pDate.getFullYear() === year;
        });

        const clientPremiumTotal = clientPayments.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
        const clientCommission = clientPremiumTotal * commissionRate;

        totalPremiums += clientPremiumTotal;
        totalCommission += clientCommission;

        return {
          id: client.id,
          name: (client.firstName || "") + " " + (client.lastName || ""),
          premiumPaid: clientPremiumTotal,
          commission: clientCommission,
          paymentsCount: clientPayments.length
        };
      }).filter(c => c.paymentsCount > 0);

      return {
        id: agent.id,
        name: (agent.firstName || "") + " " + (agent.lastName || ""),
        email: agent.email || "",
        commissionRate: commissionRate * 100,
        clientsCount: agentClients.length,
        activePayingClients: clientDetails.length,
        totalPremiums,
        totalCommission,
        clientDetails,
        years: Math.floor(differenceInYears),
        status: paidAgents.includes(agent.id) ? "PAID" : "OWED"
      };
    });

    return NextResponse.json({
      commissions: agentCommissions,
      summary: {
        totalAgents: agentCommissions.length,
        totalPremiumsCollected: agentCommissions.reduce((acc, curr) => acc + curr.totalPremiums, 0),
        totalCommissionsOwed: agentCommissions.filter(a => a.status === "OWED").reduce((acc, curr) => acc + curr.totalCommission, 0)
      }
    });

  } catch (error) {
    console.error("Error calculating commissions:", error);
    return NextResponse.json({ error: "Failed to calculate commissions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = (await getCurrentUser()) as any;
    if (!user || (user.role !== "DIRECTOR" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agentId, month, year, amount } = body;

    if (!agentId || month === undefined || year === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Save payment record
    await set(ref(db, `commissionPayments/${year}/${month}/${agentId}`), {
      amount,
      paidAt: new Date().toISOString(),
      paidById: user.id || user.uid || "SYSTEM",
      status: "PAID"
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving commission payment:", error);
    return NextResponse.json({ error: "Failed to save payment" }, { status: 500 });
  }
}
