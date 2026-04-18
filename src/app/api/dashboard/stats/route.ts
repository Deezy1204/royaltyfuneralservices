
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
    // Using individual try-catches or a safer Promise.all
    let clientsSnap, policiesSnap, proposalsSnap, claimsSnap, alterationsSnap, paymentsSnap;
    
    try {
      [clientsSnap, policiesSnap, proposalsSnap, claimsSnap, alterationsSnap, paymentsSnap] = await Promise.all([
        get(ref(db, 'clients')),
        get(ref(db, 'policies')),
        get(ref(db, 'proposals')),
        get(ref(db, 'claims')),
        get(ref(db, 'alterations')),
        get(ref(db, 'payments'))
      ]);
    } catch (dbError) {
      console.error("Firebase Database Error in stats:", dbError);
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const isAgent = user.role === "AGENT";

    let totalClients = 0;
    let activeClients = 0;

    if (clientsSnap && clientsSnap.exists()) {
      clientsSnap.forEach(c => {
        const val = c.val();
        if (val && !val.deletedAt) {
          if (isAgent && (val.agentId !== user.userId && val.createdById !== user.userId)) return;
          
          totalClients++;
          if (val.isActive) activeClients++;
        }
      });
    }

    let totalPolicies = 0;
    let activePolicies = 0;
    const policiesByPlanMap: Record<string, number> = {};

    if (policiesSnap && policiesSnap.exists()) {
      policiesSnap.forEach(p => {
        const val = p.val();
        if (val && !val.deletedAt) {
          if (isAgent && (val.agentId !== user.userId && val.createdById !== user.userId)) return;

          totalPolicies++;
          if (val.status === "ACTIVE") {
            activePolicies++;
            const plan = (typeof val.planType === 'string' ? val.planType : "UNKNOWN") || "UNKNOWN";
            policiesByPlanMap[plan] = (policiesByPlanMap[plan] || 0) + 1;
          }
        }
      });
    }

    let pendingProposals = 0;
    if (proposalsSnap && proposalsSnap.exists()) {
      proposalsSnap.forEach(p => {
        const val = p.val();
        if (val && !val.deletedAt && ["DRAFT", "SUBMITTED", "UNDER_REVIEW"].includes(val.status)) {
          if (isAgent && val.createdBy !== user.userId && val.agentId !== user.userId) return;
          pendingProposals++;
        }
      });
    }

    let totalClaims = 0;
    let pendingClaims = 0;
    let claimsPaidSum = 0;
    if (claimsSnap && claimsSnap.exists()) {
      claimsSnap.forEach(c => {
        const val = c.val();
        if (val && !val.deletedAt) {
          if (isAgent && val.agentId !== user.userId && val.createdById !== user.userId) return;
          
          totalClaims++;
          if (["PENDING", "UNDER_REVIEW"].includes(val.status)) {
            pendingClaims++;
          }
          if (val.status === "PAID" && val.paidAt) {
            const paidDate = new Date(val.paidAt).getTime();
            if (!isNaN(paidDate) && paidDate >= startOfMonth) {
              claimsPaidSum += (Number(val.approvedAmount) || 0);
            }
          }
        }
      });
    }

    let pendingAlterations = 0;
    if (alterationsSnap && alterationsSnap.exists()) {
      alterationsSnap.forEach(a => {
        const val = a.val();
        if (val && !val.deletedAt && ["SUBMITTED", "UNDER_REVIEW"].includes(val.status)) {
          if (isAgent && val.agentId !== user.userId && val.createdById !== user.userId) return;
          pendingAlterations++;
        }
      });
    }

    let pendingPayments = 0;
    let monthlyRevenue = 0;
    const paymentsByMethodMap: Record<string, number> = {};

    if (paymentsSnap && paymentsSnap.exists()) {
      paymentsSnap.forEach(p => {
        const val = p.val();
        if (val && !val.deletedAt) {
          if (isAgent && val.agentId !== user.userId && val.createdById !== user.userId) return;

          if (val.status === "PENDING") {
            pendingPayments++;
          }

          if (val.status === "CONFIRMED" && val.paymentDate) {
            if (val.paymentMethod) {
              const method = String(val.paymentMethod).toUpperCase().trim();
              paymentsByMethodMap[method] = (paymentsByMethodMap[method] || 0) + 1;
            }
            
            const pDate = new Date(val.paymentDate).getTime();
            if (!isNaN(pDate) && pDate >= startOfMonth) {
              monthlyRevenue += (Number(val.amount) || 0);
            }
          }
        }
      });
    }

    const policiesByPlan = Object.entries(policiesByPlanMap).map(([plan, count]) => ({ plan, count }));
    const paymentsByMethod = Object.entries(paymentsByMethodMap).map(([method, count]) => ({ method, count }));

    const stats = {
      totalClients,
      activeClients,
      totalPolicies,
      activePolicies,
      pendingProposals,
      totalClaims,
      pendingClaims,
      pendingAlterations,
      pendingPayments,
      monthlyRevenue,
      claimsPaid: claimsPaidSum,
      policiesByPlan,
      paymentsByMethod,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
