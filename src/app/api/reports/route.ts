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

        const searchParams = request.nextUrl.searchParams;
        const targetMonth = parseInt(searchParams.get("month") || new Date().getMonth().toString());
        const targetYear = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

        const targetMonthStr = `${targetYear}-${(targetMonth + 1).toString().padStart(2, '0')}`;
        
        // For growth calculation, we still need last month relative to TARGET
        const prevMonthDate = new Date(targetYear, targetMonth - 1, 1);
        const prevMonthStr = prevMonthDate.toISOString().slice(0, 7);

        // Fetch all necessary data
        const [paymentsSnap, claimsSnap, policiesSnap, usersSnap, clientsSnap] = await Promise.all([
            get(ref(db, 'payments')),
            get(ref(db, 'claims')),
            get(ref(db, 'policies')),
            get(ref(db, 'users')),
            get(ref(db, 'clients'))
        ]);

        const agentClientIds = new Set<string>();
        if (user.role === "AGENT" && clientsSnap.exists()) {
            clientsSnap.forEach(child => {
                const c = child.val();
                if (c.agentId === user.userId || c.createdById === user.userId) {
                    agentClientIds.add(child.key as string);
                }
            });
        }

        const formatMonth = (isoString: string) => {
            if (!isoString) return "";
            const d = new Date(isoString);
            return `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
        };

        // Calculations
        let totalRevenue = 0;
        let prevMonthRevenue = 0;
        let targetMonthRevenue = 0;

        const monthlyDataMap: Record<string, { revenue: number, claims: number, newPolicies: number }> = {};

        if (paymentsSnap.exists()) {
            paymentsSnap.forEach((childSnap) => {
                const pay = childSnap.val();
                if (pay.status === "CONFIRMED" && !pay.deletedAt) {
                    // Filter by agent if applicable
                    if (user.role === "AGENT" && !agentClientIds.has(pay.clientId)) {
                        return;
                    }

                    const amount = parseFloat(pay.amount) || 0;
                    totalRevenue += amount;

                    const payMonth = (pay.paymentDate || pay.createdAt)?.slice(0, 7);
                    if (payMonth === targetMonthStr) targetMonthRevenue += amount;
                    if (payMonth === prevMonthStr) prevMonthRevenue += amount;

                    const formattedMonth = formatMonth(pay.paymentDate || pay.createdAt);
                    if (!monthlyDataMap[formattedMonth]) {
                        monthlyDataMap[formattedMonth] = { revenue: 0, claims: 0, newPolicies: 0 };
                    }
                    monthlyDataMap[formattedMonth].revenue += amount;
                }
            });
        }

        let totalClaimsPaid = 0;
        let prevMonthClaims = 0;
        let targetMonthClaims = 0;

        if (claimsSnap.exists()) {
            claimsSnap.forEach((childSnap) => {
                const claim = childSnap.val();
                if (["APPROVED", "PAID", "COMPLETED"].includes(claim.status) && !claim.deletedAt) {
                    // Filter by agent if applicable
                    if (user.role === "AGENT" && !agentClientIds.has(claim.clientId)) {
                        return;
                    }

                    const amount = parseFloat(claim.approvedAmount || claim.claimAmount) || 0;
                    totalClaimsPaid += amount;

                    const claimMonth = (claim.updatedAt || claim.createdAt)?.slice(0, 7);
                    if (claimMonth === targetMonthStr) targetMonthClaims += amount;
                    if (claimMonth === prevMonthStr) prevMonthClaims += amount;

                    const formattedMonth = formatMonth(claim.updatedAt || claim.createdAt);
                    if (!monthlyDataMap[formattedMonth]) {
                        monthlyDataMap[formattedMonth] = { revenue: 0, claims: 0, newPolicies: 0 };
                    }
                    monthlyDataMap[formattedMonth].claims += amount;
                }
            });
        }

        let totalPoliciesCount = 0;
        let newPoliciesTargetMonth = 0;
        let newPoliciesPrevMonth = 0;

        const planDistributionMap: Record<string, { count: number, revenue: number }> = {};
        const agentStatsMap: Record<string, { policies: number, revenue: number }> = {};

        if (policiesSnap.exists()) {
            policiesSnap.forEach((childSnap) => {
                const pol = childSnap.val();
                if (!pol.deletedAt && pol.status !== "CANCELLED") {
                    // Filter by agent if applicable
                    if (user.role === "AGENT" && !agentClientIds.has(pol.clientId)) {
                        return;
                    }

                    totalPoliciesCount++;
                    const polMonth = pol.createdAt?.slice(0, 7);
                    
                    const isTargetMonth = polMonth === targetMonthStr;
                    if (isTargetMonth) newPoliciesTargetMonth++;
                    if (polMonth === prevMonthStr) newPoliciesPrevMonth++;

                    const formattedMonth = formatMonth(pol.createdAt);
                    if (!monthlyDataMap[formattedMonth]) {
                        monthlyDataMap[formattedMonth] = { revenue: 0, claims: 0, newPolicies: 0 };
                    }
                    monthlyDataMap[formattedMonth].newPolicies++;

                    const plan = pol.planType || "UNKNOWN";
                    if (!planDistributionMap[plan]) planDistributionMap[plan] = { count: 0, revenue: 0 };
                    planDistributionMap[plan].count++;
                    planDistributionMap[plan].revenue += (parseFloat(pol.premiumAmount) || 0);

                    // For agents, only track performance for the TARGET month as per requirements
                    const agentId = pol.agentId || pol.createdById || pol.createdBy;
                    if (agentId && isTargetMonth) {
                        if (!agentStatsMap[agentId]) agentStatsMap[agentId] = { policies: 0, revenue: 0 };
                        agentStatsMap[agentId].policies++;
                        agentStatsMap[agentId].revenue += (parseFloat(pol.premiumAmount) || 0);
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
                percentage: Math.round((stats.count / totalPoliciesCount) * 100) || 0,
                revenue: stats.revenue
            }));

        // Format Top Agents
        let users: any = {};
        if (usersSnap.exists()) {
            users = usersSnap.val();
        }

        const topAgents = Object.entries(agentStatsMap)
            .map(([agentId, stats]) => {
                const userObj = users[agentId];
                let name = "System Administrator";
                if (userObj && userObj.isActive && !userObj.deletedAt) {
                    name = `${userObj.firstName || "Agent"} ${userObj.lastName || ""}`;
                }
                return {
                    name: name.trim(),
                    policies: stats.policies,
                    revenue: stats.revenue
                };
            })
            .sort((a, b) => b.policies - a.policies) // Requirement: compare clients they registered
            .slice(0, 10); 

        const revenueGrowth = prevMonthRevenue ? ((targetMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;
        const claimsGrowth = prevMonthClaims ? ((targetMonthClaims - prevMonthClaims) / prevMonthClaims) * 100 : 0;
        const policyGrowth = newPoliciesPrevMonth ? ((newPoliciesTargetMonth - newPoliciesPrevMonth) / newPoliciesPrevMonth) * 100 : 0;

        return NextResponse.json({
            keyMetrics: {
                totalRevenue: targetMonthRevenue, 
                revenueGrowth,
                claimsPaid: targetMonthClaims,
                claimsGrowth,
                newPolicies: newPoliciesTargetMonth,
                policyGrowth,
                netPosition: targetMonthRevenue - targetMonthClaims
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
