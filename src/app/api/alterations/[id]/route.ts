
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, child, update } from "firebase/database";
import { getCurrentUser, createAuditLog } from "@/lib/auth";
import { addMonths, addDays } from "@/lib/utils";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const alterationRef = child(ref(db), `alterations/${id}`);
        const snapshot = await get(alterationRef);

        if (!snapshot.exists()) {
            return NextResponse.json({ error: "Alteration not found" }, { status: 404 });
        }

        const alteration = snapshot.val();

        // Enhance with policy, client, and user info
        let policy: any = { policyNumber: "N/A", planType: "N/A", client: { firstName: "", lastName: "", clientNumber: "" } };
        let createdBy = { firstName: "Unknown", lastName: "User" };
        let approvedBy = { firstName: "", lastName: "" };

        if (alteration.policyId) {
            const policySnap = await get(child(ref(db), `policies/${alteration.policyId}`));
            if (policySnap.exists()) {
                const p = policySnap.val();
                let client = { firstName: "", lastName: "", clientNumber: "" };
                if (p.clientId) {
                    const cSnap = await get(child(ref(db), `clients/${p.clientId}`));
                    if (cSnap.exists()) client = cSnap.val();
                }
                policy = { ...p, client };
            }
        }

        if (alteration.createdById) {
            const uSnap = await get(child(ref(db), `users/${alteration.createdById}`));
            if (uSnap.exists()) createdBy = uSnap.val();
        }

        if (alteration.approvedById) {
            const uSnap = await get(child(ref(db), `users/${alteration.approvedById}`));
            if (uSnap.exists()) approvedBy = uSnap.val();
        }

        const enhancedAlteration = {
            ...alteration,
            id,
            policy: {
                policyNumber: policy.policyNumber,
                planType: policy.planType,
                client: {
                    firstName: policy.client.firstName,
                    lastName: policy.client.lastName,
                    clientNumber: policy.client.clientNumber
                }
            },
            createdBy: { firstName: createdBy.firstName, lastName: createdBy.lastName },
            approvedBy: { firstName: approvedBy.firstName, lastName: approvedBy.lastName }
        };

        return NextResponse.json({ alteration: enhancedAlteration });
    } catch (error) {
        console.error("Error fetching alteration:", error);
        return NextResponse.json({ error: "Failed to fetch alteration" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || !["ADMIN", "DIRECTOR", "GENERAL_MANAGER"].includes(user.role)) {
            return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status, notes } = body;

        const alterationRef = child(ref(db), `alterations/${id}`);
        const snapshot = await get(alterationRef);

        if (!snapshot.exists()) {
            return NextResponse.json({ error: "Alteration not found" }, { status: 404 });
        }

        const alteration = snapshot.val();
        const updates: any = {
            status,
            approvedById: user.userId,
            approvedAt: new Date().toISOString()
        };
        if (notes) updates.adminNotes = notes;

        await update(alterationRef, updates);

        // If approved, apply changes to the policy
        if (status === "APPROVED") {
            const policyId = alteration.policyId;
            const policyRef = child(ref(db), `policies/${policyId}`);
            const policySnap = await get(policyRef);

            if (policySnap.exists()) {
                const policyUpdates: any = {};
                const currentPolicy = policySnap.val();

                if (alteration.newPlan) policyUpdates.planType = alteration.newPlan;
                if (alteration.newPremium) policyUpdates.premiumAmount = alteration.newPremium;
                if (alteration.newCover) policyUpdates.coverAmount = alteration.newCover;

                // Payment changes
                if (alteration.alterationType === "CHANGE_PAYMENT") {
                    if (alteration.newPaymentMethod) policyUpdates.paymentMethod = alteration.newPaymentMethod;
                    if (alteration.newBankName) policyUpdates.bankName = alteration.newBankName;
                    if (alteration.newAccountNumber) policyUpdates.accountNumber = alteration.newAccountNumber;
                    if (alteration.newBranchCode) policyUpdates.branchCode = alteration.newBranchCode;
                    if (alteration.newDebitDay) policyUpdates.debitOrderDay = parseInt(alteration.newDebitDay);
                }

                // General details changes
                if (alteration.alterationType === "CHANGE_DETAILS" && alteration.changeField && alteration.changeValue) {
                    policyUpdates[alteration.changeField.toLowerCase()] = alteration.changeValue;
                }

                // Handle Dependents
                if (alteration.alterationType === "ADD_DEPENDENT") {
                    const now = new Date();
                    const depId = `dep_${now.getTime()}_${Math.floor(Math.random() * 1000)}`;
                    const newDependent = {
                        firstName: alteration.dependentName,
                        lastName: "",
                        idNumber: alteration.dependentId,
                        dateOfBirth: alteration.dependentDOB || now.toISOString(),
                        relationship: "Dependent",
                        policyId,
                        clientId: currentPolicy.clientId || null,
                        waitingPeriodEnd: addDays(now, 90).toISOString()
                    };

                    const existingDeps = currentPolicy.dependents || {};
                    policyUpdates.dependents = { ...existingDeps, [depId]: newDependent };
                } else if (alteration.alterationType === "REMOVE_DEPENDENT") {
                    const existingDeps = currentPolicy.dependents || {};
                    const nameToRemove = alteration.dependentName;
                    const updatedDeps = { ...existingDeps };
                    Object.keys(updatedDeps).forEach(key => {
                        const dep = updatedDeps[key];
                        if (dep.idNumber === nameToRemove || dep.firstName === nameToRemove || `${dep.firstName} ${dep.lastName}`.trim() === nameToRemove) {
                            delete updatedDeps[key];
                        }
                    });
                    policyUpdates.dependents = updatedDeps;
                }

                if (Object.keys(policyUpdates).length > 0) {
                    await update(policyRef, policyUpdates);
                }
            }
        }

        await createAuditLog(
            user.userId,
            status === "APPROVED" ? "UPDATE" : "REJECT",
            "alteration",
            id,
            "Alteration",
            alteration.status,
            status,
            `Alteration ${alteration.alterationNumber} was ${status.toLowerCase()} by ${user.userId}`
        );

        return NextResponse.json({ message: `Alteration ${status.toLowerCase()} successfully` });
    } catch (error) {
        console.error("Error updating alteration:", error);
        return NextResponse.json({ error: "Failed to update alteration" }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (!["ADMIN", "DIRECTOR", "GENERAL_MANAGER"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { id } = await params;
        const snap = await get(child(ref(db), `alterations/${id}`));
        if (!snap.exists()) return NextResponse.json({ error: "Alteration not found" }, { status: 404 });

        const existing = snap.val();
        await update(child(ref(db), `alterations/${id}`), {
            deletedAt: new Date().toISOString(),
            deletedBy: user.userId,
        });

        await createAuditLog(
            user.userId, "DELETE", "alteration", id, "Alteration", existing, null,
            `Deleted alteration ${existing.alterationNumber}`
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting alteration:", error);
        return NextResponse.json({ error: "Failed to delete alteration" }, { status: 500 });
    }
}
