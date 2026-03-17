import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, child } from "firebase/database";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();
        const thisMonthStr = now.toISOString().slice(0, 7); // YYYY-MM
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthStr = lastMonth.toISOString().slice(0, 7);

        // Fetch all necessary data
        const [paymentsSnap, claimsSnap, policiesSnap, usersSnap] = await Promise.all([
            get(ref(db, 'payments')),
            get(ref(db, 'claims')),
            get(ref(db, 'policies')),
            get(ref(db, 'users'))
        ]);

        const formatMonth = (isoString: string) => {
            if (!isoString) return "";
            const d = new Date(isoString);
            return `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
        };

        // Calculations
        let totalRevenue = 0;
        let lastMonthRevenue = 0;
        let thisMonthRevenue = 0;

        const monthlyDataMap: Record<string, { revenue: number, claims: number, newPolicies: number }> = {};

        if (paymentsSnap.exists()) {
            paymentsSnap.forEach((childSnap) => {
                const pay = childSnap.val();
                if (pay.status === "CONFIRMED" && !pay.deletedAt) {
                    const amount = parseFloat(pay.amount) || 0;
                    totalRevenue += amount;

                    const payMonth = (pay.paymentDate || pay.createdAt)?.slice(0, 7);
                    if (payMonth === thisMonthStr) thisMonthRevenue += amount;
                    if (payMonth === lastMonthStr) lastMonthRevenue += amount;

                    const formattedMonth = formatMonth(pay.paymentDate || pay.createdAt);
                    if (!monthlyDataMap[formattedMonth]) {
                        monthlyDataMap[formattedMonth] = { revenue: 0, claims: 0, newPolicies: 0 };
                    }
                    monthlyDataMap[formattedMonth].revenue += amount;
                }
            });
        }

        let totalClaimsPaid = 0;
        let lastMonthClaims = 0;
        let thisMonthClaims = 0;

        if (claimsSnap.exists()) {
            claimsSnap.forEach((childSnap) => {
                const claim = childSnap.val();
                if (["APPROVED", "PAID", "COMPLETED"].includes(claim.status) && !claim.deletedAt) {
                    const amount = parseFloat(claim.approvedAmount || claim.claimAmount) || 0;
                    totalClaimsPaid += amount;

                    const claimMonth = (claim.updatedAt || claim.createdAt)?.slice(0, 7);
                    if (claimMonth === thisMonthStr) thisMonthClaims += amount;
                    if (claimMonth === lastMonthStr) lastMonthClaims += amount;

                    const formattedMonth = formatMonth(claim.updatedAt || claim.createdAt);
                    if (!monthlyDataMap[formattedMonth]) {
                        monthlyDataMap[formattedMonth] = { revenue: 0, claims: 0, newPolicies: 0 };
                    }
                    monthlyDataMap[formattedMonth].claims += amount;
                }
            });
        }

        let totalPolicies = 0;
        let newPoliciesThisMonth = 0;
        let newPoliciesLastMonth = 0;

        const planDistributionMap: Record<string, { count: number, revenue: number }> = {};
        const agentStatsMap: Record<string, { policies: number, revenue: number }> = {};

        if (policiesSnap.exists()) {
            policiesSnap.forEach((childSnap) => {
                const pol = childSnap.val();
                if (!pol.deletedAt && pol.status !== "CANCELLED") {
                    totalPolicies++;
                    const polMonth = pol.createdAt?.slice(0, 7);
                    if (polMonth === thisMonthStr) newPoliciesThisMonth++;
                    if (polMonth === lastMonthStr) newPoliciesLastMonth++;

                    const formattedMonth = formatMonth(pol.createdAt);
                    if (!monthlyDataMap[formattedMonth]) {
                        monthlyDataMap[formattedMonth] = { revenue: 0, claims: 0, newPolicies: 0 };
                    }
                    monthlyDataMap[formattedMonth].newPolicies++;

                    const plan = pol.planType || "UNKNOWN";
                    if (!planDistributionMap[plan]) planDistributionMap[plan] = { count: 0, revenue: 0 };
                    planDistributionMap[plan].count++;
                    planDistributionMap[plan].revenue += (parseFloat(pol.premiumAmount) || 0);

                    // For agents, we might need to look at createdBy or agentId if stored on policy
                    // Assuming createdBy is the agent
                    if (pol.createdBy) {
                        if (!agentStatsMap[pol.createdBy]) agentStatsMap[pol.createdBy] = { policies: 0, revenue: 0 };
                        agentStatsMap[pol.createdBy].policies++;
                        agentStatsMap[pol.createdBy].revenue += (parseFloat(pol.premiumAmount) || 0);
                    }
                }
            });
        }

        // Format Monthly Data
        const monthlyData = Object.entries(monthlyDataMap)
            .map(([month, stats]) => ({ month, ...stats }))
            .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
            .slice(-6); // last 6 months

        // Format Plan Distribution
        const planDistribution = Object.entries(planDistributionMap)
            .map(([plan, stats]) => ({
                plan,
                count: stats.count,
                percentage: Math.round((stats.count / totalPolicies) * 100) || 0,
                revenue: stats.revenue
            }));

        // Format Top Agents
        let users: any = {};
        if (usersSnap.exists()) {
            users = usersSnap.val();
        }

        const topAgents = Object.entries(agentStatsMap)
            .map(([agentId, stats]) => {
                const userObj = users[agentId] || {};
                return {
                    name: `${userObj.firstName || "Unknown"} ${userObj.lastName || "Agent"}`,
                    policies: stats.policies,
                    revenue: stats.revenue
                };
            })
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5); // top 5

        const revenueGrowth = lastMonthRevenue ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
        const claimsGrowth = lastMonthClaims ? ((thisMonthClaims - lastMonthClaims) / lastMonthClaims) * 100 : 0;
        const policyGrowth = newPoliciesLastMonth ? ((newPoliciesThisMonth - newPoliciesLastMonth) / newPoliciesLastMonth) * 100 : 0;

        return NextResponse.json({
            keyMetrics: {
                totalRevenue: thisMonthRevenue, // or overall depending on UI
                revenueGrowth,
                claimsPaid: thisMonthClaims,
                claimsGrowth,
                newPolicies: newPoliciesThisMonth,
                policyGrowth,
                netPosition: thisMonthRevenue - thisMonthClaims
            },
            monthlyData,
            planDistribution,
            topAgents
        });

    } catch (error) {
        console.error("Error generating reports:", error);
        return NextResponse.json({ error: "Failed to generate report data" }, { status: 500 });
    }
}
