
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get("limit") || "10");
        const query = searchParams.get("query") || "";

        // Fetch policies and clients to join them manually
        // In a real app we'd denormalize data (store client info in policy)
        // For migration, we join in memory.

        const [policiesSnap, oldPoliciesSnap, clientsSnap, oldClientsSnap] = await Promise.all([
            get(ref(db, 'policies')),
            get(ref(db, 'OldPolicies')),
            get(ref(db, 'clients')),
            get(ref(db, 'OldClients'))
        ]);

        let policies: any[] = [];
        const clientsMap: Record<string, any> = {};

        if (clientsSnap.exists()) {
            clientsSnap.forEach(c => {
                clientsMap[c.key!] = c.val();
            });
        }
        if (oldClientsSnap.exists()) {
            oldClientsSnap.forEach(c => {
                clientsMap[c.key!] = { ...c.val(), isOldClient: true };
            });
        }

        if (policiesSnap.exists()) {
            policiesSnap.forEach(p => {
                const policy = p.val();
                if (!policy.deletedAt) {
                    // Filter by agent if applicable
                    if (user.role === "AGENT" && policy.agentId !== user.userId && policy.createdById !== user.userId) {
                        return;
                    }
                    const client = clientsMap[policy.clientId];
                    if (client) {
                        policies.push({
                            id: p.key,
                            ...policy,
                            client: {
                                firstName: client.firstName,
                                lastName: client.lastName,
                                idNumber: client.idNumber
                            }
                        });
                    }
                }
            });
        }

        if (oldPoliciesSnap.exists()) {
            oldPoliciesSnap.forEach(p => {
                const policy = p.val();
                if (!policy.deletedAt) {
                    // Filter by agent if applicable
                    if (user.role === "AGENT" && policy.agentId !== user.userId && policy.createdById !== user.userId) {
                        return;
                    }
                    const client = clientsMap[policy.clientId];
                    if (client) {
                        policies.push({
                            id: p.key,
                            ...policy,
                            isOldPolicy: true,
                            client: {
                                firstName: client.firstName,
                                lastName: client.lastName,
                                idNumber: client.idNumber
                            }
                        });
                    }
                }
            });
        }

        if (query) {
            const queryLower = query.toLowerCase();
            policies = policies.filter(p =>
                p.policyNumber.toLowerCase().includes(queryLower) ||
                p.client.firstName.toLowerCase().includes(queryLower) ||
                p.client.lastName.toLowerCase().includes(queryLower) ||
                p.client.idNumber.toLowerCase().includes(queryLower)
            );
        }

        // Sort desc
        policies.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        // Limit
        policies = policies.slice(0, limit);

        return NextResponse.json({ policies });
    } catch (error) {
        console.error("Error fetching policies:", error);
        return NextResponse.json(
            { error: "Failed to fetch policies" },
            { status: 500 }
        );
    }
}
