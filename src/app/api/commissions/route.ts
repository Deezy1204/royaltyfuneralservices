import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, set, push } from "firebase/database";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = (await getCurrentUser()) as any;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const month = parseInt(searchParams.get("month") || new Date().getMonth().toString());
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    // 1. Fetch all agents (unfiltered for now, we'll filter later)
    const usersSnap = await get(ref(db, "users"));
    let agents: any[] = [];
    if (usersSnap.exists()) {
      usersSnap.forEach((childSnapshot) => {
        const u = childSnapshot.val();
        if (u.role === "AGENT" && !u.deletedAt) {
          if (user.role === "AGENT" && childSnapshot.key !== user.userId) return;
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
          // If agent, only show their clients
          if (user.role === "AGENT" && c.agentId !== user.userId && c.createdById !== user.userId) return;
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

// 4. Fetch granular commission payments (tracked by payment ID)
    const paidPaymentsSnap = await get(ref(db, `commissionPaidPayments`));
    const paidPaymentIds = paidPaymentsSnap.exists() ? Object.keys(paidPaymentsSnap.val()) : [];

    const currentDate = new Date();

    // Group clients by agent
    const agentCommissions = agents.map(agent => {
      // Determine agent commission rate based on tenure: 20% if <= 1 year, else 10%
      const agentCreatedAt = agent.createdAt ? new Date(agent.createdAt) : new Date();
      const differenceInYears = (currentDate.getTime() - agentCreatedAt.getTime()) / (1000 * 3600 * 24 * 365.25);
      const commissionRate = differenceInYears <= 1 ? 0.20 : 0.10;

      const agentClients = clients.filter(c => c.createdById === agent.id || c.agentId === agent.id || c.assignedAgentId === agent.id);

      let totalPremiums = 0;
      let totalEarnedInMonth = 0;
      let totalPaidInMonth = 0;
      let totalOwedInMonth = 0;

      const clientDetails = agentClients.map(client => {
        const clientPayments = payments.filter(p => {
          if (p.clientId !== client.id) return false;
          if (!p.paymentDate) return false;
          const pDate = new Date(p.paymentDate);
          return pDate.getMonth() === month && pDate.getFullYear() === year;
        });

        let clientPremiumTotal = 0;
        let clientEarned = 0;
        let clientPaid = 0;
        let clientOwed = 0;

        const detailedPayments = clientPayments.map(p => {
          const compEarned = (Number(p.amount) || 0) * commissionRate;
          const isPaid = paidPaymentIds.includes(p.id);
          
          clientPremiumTotal += (Number(p.amount) || 0);
          clientEarned += compEarned;
          if (isPaid) clientPaid += compEarned;
          else clientOwed += compEarned;

          return {
            id: p.id,
            date: p.paymentDate,
            amount: p.amount,
            months: p.monthsCovered,
            commission: compEarned,
            paid: isPaid
          };
        });

        totalPremiums += clientPremiumTotal;
        totalEarnedInMonth += clientEarned;
        totalPaidInMonth += clientPaid;
        totalOwedInMonth += clientOwed;

        return {
          id: client.id,
          name: (client.firstName || "") + " " + (client.lastName || ""),
          premiumPaid: clientPremiumTotal,
          commission: clientEarned,
          paidAmount: clientPaid,
          owedAmount: clientOwed,
          paymentsCount: clientPayments.length,
          payments: detailedPayments
        };
      }).filter(c => c.paymentsCount > 0);

      let status: "OWED" | "PAID" | "PARTLY_PAID" = "OWED";
      if (totalPaidInMonth >= totalEarnedInMonth && totalEarnedInMonth > 0) {
        status = "PAID";
      } else if (totalPaidInMonth > 0) {
        status = "PARTLY_PAID";
      }

      return {
        id: agent.id,
        name: (agent.firstName || "") + " " + (agent.lastName || ""),
        email: agent.email || "",
        commissionRate: commissionRate * 100,
        clientsCount: agentClients.length,
        activePayingClients: clientDetails.length,
        totalPremiums,
        totalCommission: totalEarnedInMonth, // Total potential for this month
        totalPaid: totalPaidInMonth,
        totalOwed: totalOwedInMonth,
        clientDetails,
        years: Math.floor(differenceInYears),
        status
      };
    });

    return NextResponse.json({
      commissions: agentCommissions,
      summary: {
        totalAgents: agentCommissions.length,
        totalPremiumsCollected: agentCommissions.reduce((acc, curr) => acc + curr.totalPremiums, 0),
        totalCommissionsOwed: agentCommissions.reduce((acc, curr) => acc + curr.totalOwed, 0)
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
    const { paymentId, amount, agentId } = body;

    if (!paymentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Save granular payment record
    await set(ref(db, `commissionPaidPayments/${paymentId}`), {
      amount,
      agentId,
      paidAt: new Date().toISOString(),
      paidById: user.userId || user.id || "SYSTEM",
      status: "PAID"
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving commission payment:", error);
    return NextResponse.json({ error: "Failed to save payment" }, { status: 500 });
  }
}
