import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, child } from "firebase/database";
import { getCurrentUser } from "@/lib/auth";
import { isWaitingPeriodComplete } from "@/lib/utils";

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const notifications: any[] = [];
        let idCounter = 1;

        // Fetch needed data
        const [proposalsSnap, claimsSnap, policiesSnap, clientsSnap] = await Promise.all([
            get(ref(db, 'proposals')),
            get(ref(db, 'claims')),
            get(ref(db, 'policies')),
            get(ref(db, 'clients')),
        ]);

        const clients: any = clientsSnap.exists() ? clientsSnap.val() : {};

        // 1. Pending Proposals
        if (proposalsSnap.exists()) {
            proposalsSnap.forEach((childSnap) => {
                const prop = childSnap.val();
                if (prop.status === "PENDING" && !prop.deletedAt) {
                    if (user.role === "AGENT" && prop.createdById !== user.userId && prop.agentId !== user.userId) return;

                    const clientName = prop.clientId && clients[prop.clientId]
                        ? `${clients[prop.clientId].firstName} ${clients[prop.clientId].lastName}`
                        : "Unknown Client";

                    notifications.push({
                        id: idCounter++,
                        type: "PENDING_APPROVAL",
                        title: "Proposal Pending Approval",
                        message: `Proposal ${prop.proposalNumber} from ${clientName} requires your review`,
                        time: new Date(prop.createdAt).toISOString(),
                        read: false,
                        priority: "HIGH",
                        link: `/proposals/${childSnap.key}`
                    });
                }
            });
        }

        // 2. Claims (Pending or Recently Approved)
        if (claimsSnap.exists()) {
            claimsSnap.forEach((childSnap) => {
                const claim = childSnap.val();
                if (!claim.deletedAt) {
                    if (claim.status === "SUBMITTED" || claim.status === "UNDER_REVIEW") {
                        if (user.role === "AGENT" && claim.createdById !== user.userId && claim.agentId !== user.userId) return;

                        notifications.push({
                            id: idCounter++,
                            type: "CLAIM_UPDATE",
                            title: "Claim Requires Attention",
                            message: `Claim ${claim.claimNumber} is currently ${claim.status.replace("_", " ")}`,
                            time: new Date(claim.updatedAt || claim.createdAt).toISOString(),
                            read: false,
                            priority: "HIGH",
                            link: `/claims/${childSnap.key}` // Or a claims list if specific claim page isn't ready
                        });
                    } else if (claim.status === "APPROVED") {
                        // Only show if approved recently e.g., in last 7 days
                        const daysSince = (new Date().getTime() - new Date(claim.updatedAt).getTime()) / (1000 * 3600 * 24);
                        if (daysSince <= 7) {
                            notifications.push({
                                id: idCounter++,
                                type: "CLAIM_UPDATE",
                                title: "Claim Approved",
                                message: `Claim ${claim.claimNumber} was approved for ${claim.approvedAmount}`,
                                time: new Date(claim.updatedAt).toISOString(),
                                read: true,
                                priority: "NORMAL",
                                link: `/claims`
                            });
                        }
                    }
                }
            });
        }

        // 3. Policies (Arrears, Renewals, Waiting Period)
        if (policiesSnap.exists()) {
            const now = new Date();
            policiesSnap.forEach((childSnap) => {
                const pol = childSnap.val();
                if (!pol.deletedAt && pol.status === "ACTIVE") {
                    if (user.role === "AGENT" && pol.agentId !== user.userId && pol.createdById !== user.userId) return;

                    const clientName = pol.clientId && clients[pol.clientId]
                        ? `${clients[pol.clientId].firstName} ${clients[pol.clientId].lastName}`
                        : "Unknown Client";

                    // Waiting period ends soon (in next 7 days)
                    if (pol.waitingPeriodEnd) {
                        const wpEnd = new Date(pol.waitingPeriodEnd);
                        const daysToWpEnd = (wpEnd.getTime() - now.getTime()) / (1000 * 3600 * 24);
                        if (daysToWpEnd > 0 && daysToWpEnd <= 7) {
                            notifications.push({
                                id: idCounter++,
                                type: "WAITING_PERIOD_END",
                                title: "Waiting Period Ending Soon",
                                message: `Client ${clientName}'s waiting period ends in ${Math.ceil(daysToWpEnd)} days`,
                                time: new Date().toISOString(),
                                read: true,
                                priority: "LOW",
                                link: `/policies/${childSnap.key}`
                            });
                        }
                    }
                }
            });
        }

        // Sort notifications by time (most recent first)
        notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        return NextResponse.json({ notifications });
    } catch (error) {
        console.error("Error generating notifications:", error);
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }
}
