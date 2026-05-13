
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, child, update, push, set } from "firebase/database";
import { getCurrentUser, createAuditLog } from "@/lib/auth";
import { generateNumber, addMonths, addDays, sanitizeForFirebase } from "@/lib/utils";

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
    const proposalSnap = await get(child(ref(db), `proposals/${id}`));

    if (!proposalSnap.exists()) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }
    const proposalData = proposalSnap.val();
    if (proposalData.deletedAt) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Resolve relations
    let agent = {};
    let client = {};
    let policy = {};
    const documents: any[] = []; // Not implemented in this migration

    if (proposalData.agentId) {
      const ag = await get(child(ref(db), `users/${proposalData.agentId}`));
      if (ag.exists()) agent = ag.val();
    }
    if (proposalData.clientId) {
      const cl = await get(child(ref(db), `clients/${proposalData.clientId}`));
      if (cl.exists()) client = cl.val();
    }
    // Policy might not exist yet if draft, but if approved it might be linked? 
    // Usually proposal -> creates policy. 
    // Proposal model in Prisma had 'Policy' relation? 
    // Looking at schema from previous context, Proposal didn't look like it stored policyId directly on itself always, 
    // but Prisma `include: { policy: true }` implies a relation. 
    // The create policy logic updates proposal with `policyId`.
    if (proposalData.policyId) {
      const pol = await get(child(ref(db), `policies/${proposalData.policyId}`));
      if (pol.exists()) policy = pol.val();
    }

    const proposal = {
      id,
      ...proposalData,
      agent,
      client,
      policy,
      documents
    };

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error("Error fetching proposal:", error);
    return NextResponse.json({ error: "Failed to fetch proposal" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const propRef = child(ref(db), `proposals/${id}`);
    const propSnap = await get(propRef);
    if (!propSnap.exists()) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }
    const existing = propSnap.val();

    const updateData: Record<string, any> = {};

    if (body.status) {
      updateData.status = body.status;
      if (body.status === "SUBMITTED") updateData.submittedAt = new Date().toISOString();
      if (body.status === "UNDER_REVIEW") updateData.reviewedAt = new Date().toISOString();
      if (body.status === "REJECTED") {
        // Only ADMINs can reject
        if (!["ADMIN", "DIRECTOR", "GENERAL_MANAGER"].includes(user.role)) {
          return NextResponse.json({ error: "Only Administrators can reject proposals" }, { status: 403 });
        }
        updateData.rejectedAt = new Date().toISOString();
        updateData.rejectionReason = body.rejectionReason;
      }
    }

    // Handle approval - ADMIN only
    if (body.status === "APPROVED") {
      if (!["ADMIN", "DIRECTOR", "GENERAL_MANAGER"].includes(user.role)) {
        return NextResponse.json({ error: "Only Administrators can approve proposals" }, { status: 403 });
      }
      updateData.approvedAt = new Date().toISOString();

      // Create client if not linked
      let clientId = existing.clientId;
      if (!clientId) {
        // Create New Client
        const newClient = {
          clientNumber: generateNumber("RFS"),
          title: existing.clientTitle,
          firstName: existing.clientFirstName,
          lastName: existing.clientLastName,
          idNumber: existing.clientIdNumber,
          dateOfBirth: existing.clientDOB || new Date().toISOString(), // Fallback
          gender: existing.clientGender,
          phone: existing.clientPhone,
          email: existing.clientEmail,
          streetAddress: existing.clientAddress,
          city: existing.clientCity,
          postalCode: existing.clientPostalCode,
          createdAt: new Date().toISOString(),
          isActive: true,
          agentId: existing.agentId || null,
          createdById: existing.createdBy || null,
          maritalStatus: existing.maritalStatus || null,
        };
        const newClientRef = push(ref(db, 'clients'));
        await set(newClientRef, sanitizeForFirebase(newClient));
        clientId = newClientRef.key;
        updateData.clientId = clientId;
      }

      // Create Policy
      const now = new Date();
      const newPolicy = {
        policyNumber: generateNumber("POL"),
        clientId,
        policyType: existing.policyType,
        planType: existing.planType,
        planServiceType: existing.planServiceType || "SERVICE",
        premiumAmount: existing.proposedPremium,
        inceptionDate: now.toISOString(),
        effectiveDate: now.toISOString(),
        renewalDate: addMonths(now, 12).toISOString(),
        waitingPeriodEnd: addDays(now, 90).toISOString(),
        status: "ACTIVE",
        paymentFrequency: existing.paymentFrequency,
        paymentMethod: existing.paymentMethod,
        debitOrderDay: existing.debitOrderDay,
        createdAt: now.toISOString(),
        agentId: existing.agentId || null,
        createdById: existing.createdBy || null
      };

      const newPolicyRef = push(ref(db, 'policies'));
      await set(newPolicyRef, sanitizeForFirebase(newPolicy));
      const policyId = newPolicyRef.key;
      updateData.policyId = policyId;

      // Dependents
      if (existing.dependentsData) {
        const dependents = JSON.parse(existing.dependentsData);
        // In Firebase, we can store dependents as a sub-node of policy or separate.
        // Let's store them in the policy object to keep it self-contained for easy fetching,
        // OR in a `dependents` node referencing policyId.
        // Prisma had `Dependent` (linked to Client) and `PolicyDependent` (link Policy-Dependent).
        // Simpler here: Store `policyDependents` in a separate node or nested. 
        // Let's nest them in policy for simplicity given we don't have a strict relational requirement 
        // to reuse dependents across policies yet (though that's a feature).
        // Better: Create `dependents` (linked to Client) and push to that list. 
        // Then link to policy? 
        // Let's just create them in `policy.dependents` map for now, indexed by ID? 
        // No, let's follow the Client -> Dependents pattern if we want to list client dependents.
        // I'll create them in `dependents` node (if we had one, but we haven't mocked one yet).
        // I will put them in `policy.dependents` as an array/map.

        const depsMap: Record<string, any> = {};
        dependents.forEach((dep: any, idx: number) => {
          const depId = `dep_${now.getTime()}_${idx}`;
          depsMap[depId] = {
            ...dep,
            policyId,
            clientId,
            waitingPeriodEnd: addDays(now, 90).toISOString()
          };
        });

        await update(newPolicyRef, sanitizeForFirebase({ dependents: depsMap }));
      }

      // Beneficiaries
      if (existing.beneficiariesData) {
        const beneficiaries = JSON.parse(existing.beneficiariesData);
        const bensMap: Record<string, any> = {};
        beneficiaries.forEach((ben: any, idx: number) => {
          const benId = `ben_${now.getTime()}_${idx}`;
          bensMap[benId] = {
            ...ben,
            policyId,
            clientId,
            allocation: ben.proportion || ben.allocation || 100 // Fallback or handle null
          };
        });
        await update(newPolicyRef, sanitizeForFirebase({ beneficiaries: bensMap }));
      }
    }

    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.policyType) updateData.policyType = body.policyType;
    if (body.planServiceType) updateData.planServiceType = body.planServiceType;
    if (body.planType) updateData.planType = body.planType;
    if (body.proposedPremium) updateData.proposedPremium = parseFloat(body.proposedPremium);

    await update(propRef, sanitizeForFirebase(updateData));

    const updatedProposal = { ...existing, ...updateData, id };

    await createAuditLog(
      user.userId,
      "UPDATE",
      "proposal",
      id,
      "Proposal",
      existing,
      updatedProposal,
      `Updated proposal ${updatedProposal.proposalNumber}`
    );

    return NextResponse.json({ proposal: updatedProposal });
  } catch (error) {
    console.error("Error updating proposal:", error);
    return NextResponse.json({ error: "Failed to update proposal" }, { status: 500 });
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
    const snap = await get(child(ref(db), `proposals/${id}`));
    if (!snap.exists()) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

    const existing = snap.val();
    await update(child(ref(db), `proposals/${id}`), {
      deletedAt: new Date().toISOString(),
      deletedBy: user.userId,
    });

    await createAuditLog(
      user.userId, "DELETE", "proposal", id, "Proposal", existing, null,
      `Deleted proposal ${existing.proposalNumber}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting proposal:", error);
    return NextResponse.json({ error: "Failed to delete proposal" }, { status: 500 });
  }
}
