
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

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // Fetch all needed collections
    // In efficient real-world, we'd use counters triggering on Cloud Functions.
    // Here we fetch all.

    const [clientsSnap, policiesSnap, proposalsSnap, claimsSnap, alterationsSnap, paymentsSnap] = await Promise.all([
      get(ref(db, 'clients')),
      get(ref(db, 'policies')),
      get(ref(db, 'proposals')),
      get(ref(db, 'claims')),
      get(ref(db, 'alterations')),
      get(ref(db, 'payments'))
    ]);

    let totalClients = 0;
    let activeClients = 0;

    if (clientsSnap.exists()) {
      clientsSnap.forEach(c => {
        const val = c.val();
        if (!val.deletedAt) {
          totalClients++;
          if (val.isActive) activeClients++;
        }
      });
    }

    let totalPolicies = 0;
    let activePolicies = 0;
    let policiesWithArrearsSum = 0;
    const policiesByPlanMap: Record<string, number> = {};

    if (policiesSnap.exists()) {
      policiesSnap.forEach(p => {
        const val = p.val();
        if (!val.deletedAt) {
          totalPolicies++;
          if (val.status === "ACTIVE") {
            activePolicies++;
            // Group by plan
            const plan = val.planType || "UNKNOWN";
            policiesByPlanMap[plan] = (policiesByPlanMap[plan] || 0) + 1;
          }
          if (val.arrearsAmount && val.arrearsAmount > 0) {
            policiesWithArrearsSum += val.arrearsAmount;
          }
        }
      });
    }

    let pendingProposals = 0;
    if (proposalsSnap.exists()) {
      proposalsSnap.forEach(p => {
        const val = p.val();
        if (!val.deletedAt && ["DRAFT", "SUBMITTED", "UNDER_REVIEW"].includes(val.status)) {
          pendingProposals++;
        }
      });
    }

    let totalClaims = 0;
    let pendingClaims = 0;
    let claimsPaidSum = 0;
    if (claimsSnap.exists()) {
      claimsSnap.forEach(c => {
        const val = c.val();
        if (!val.deletedAt) {
          totalClaims++;
          if (["PENDING", "UNDER_REVIEW"].includes(val.status)) {
            pendingClaims++;
          }
          if (val.status === "PAID" && val.paidAt) {
            const paidDate = new Date(val.paidAt).getTime();
            if (paidDate >= startOfMonth) {
              claimsPaidSum += (val.approvedAmount || 0);
            }
          }
        }
      });
    }

    let pendingAlterations = 0;
    if (alterationsSnap.exists()) {
      alterationsSnap.forEach(a => {
        const val = a.val();
        if (!val.deletedAt && ["SUBMITTED", "UNDER_REVIEW"].includes(val.status)) {
          pendingAlterations++;
        }
      });
    }

    let monthlyRevenue = 0;
    if (paymentsSnap.exists()) {
      paymentsSnap.forEach(p => {
        const val = p.val();
        if (!val.deletedAt && val.status === "CONFIRMED" && val.paymentDate) {
          const pDate = new Date(val.paymentDate).getTime();
          if (pDate >= startOfMonth) {
            monthlyRevenue += (val.amount || 0);
          }
        }
      });
    }

    const policiesByPlan = Object.entries(policiesByPlanMap).map(([plan, count]) => ({ plan, count }));

    const stats = {
      totalClients,
      activeClients,
      totalPolicies,
      activePolicies,
      pendingProposals,
      totalClaims,
      pendingClaims,
      pendingAlterations,
      monthlyRevenue,
      totalArrears: policiesWithArrearsSum,
      claimsPaid: claimsPaidSum,
      policiesByPlan,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
