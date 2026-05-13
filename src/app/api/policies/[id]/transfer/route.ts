import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, child, update, push, set } from "firebase/database";
import { getCurrentUser, createAuditLog } from "@/lib/auth";
import { generateNumber, sanitizeForFirebase } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: policyId } = await params;
    const body = await request.json();
    const { claimId, newPrincipalId, formData } = body;

    const polRef = child(ref(db), `policies/${policyId}`);
    const polSnap = await get(polRef);
    if (!polSnap.exists()) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }
    const policy = polSnap.val();

    // 1. Create a new Client record for the dependent
    const clientsRef = ref(db, 'clients');
    const newClientRef = push(clientsRef);
    const clientNumber = generateNumber("C");
    
    const newClient = {
      clientNumber,
      title: formData.title || "",
      firstName: formData.firstName,
      lastName: formData.lastName,
      idNumber: formData.idNumber,
      phone: formData.phone || "",
      email: formData.email || "",
      address: formData.address || "",
      city: formData.city || "",
      postalCode: formData.postalCode || "",
      isActive: true,
      createdById: user.userId,
      agentId: policy.agentId || user.userId,
      createdAt: new Date().toISOString(),
    };

    await set(newClientRef, sanitizeForFirebase(newClient));
    const newClientId = newClientRef.key;

    // 2. Prepare policy updates
    const updatedPolicyData: any = {
      clientId: newClientId,
      status: "ACTIVE",
      planType: formData.planType,
      premiumAmount: Number(formData.premiumAmount),
      paymentMethod: formData.paymentMethod,
      updatedAt: new Date().toISOString(),
      transferSourceClaimId: claimId,
      transferredFromClientId: policy.clientId,
    };

    // Remove the dependent from the dependents list as they are now the principal
    if (policy.dependents && policy.dependents[newPrincipalId]) {
      const remainingDependents = { ...policy.dependents };
      delete remainingDependents[newPrincipalId];
      updatedPolicyData.dependents = remainingDependents;
    }

    // 3. Update the Policy
    await update(polRef, sanitizeForFirebase(updatedPolicyData));

    // 4. Delete the old client (deceased principal)
    if (policy.clientId) {
      await update(ref(db, `clients/${policy.clientId}`), {
        deletedAt: new Date().toISOString(),
        deletedBy: user.userId,
        status: "DECEASED"
      });
    }

    // 5. Update the Claim if provided
    if (claimId) {
      await update(ref(db, `claims/${claimId}`), {
        policyActionTaken: "TRANSFERRED",
        policyActionDate: new Date().toISOString(),
        policyActionTaker: user.userId
      });
    }

    // 4. Audit Log
    await createAuditLog(
      user.userId,
      "TRANSFER",
      "policy",
      policyId,
      "Policy",
      policy,
      { ...policy, ...updatedPolicyData },
      `Transferred policy ${policy.policyNumber} to new principal ${formData.firstName} ${formData.lastName}`
    );

    return NextResponse.json({ success: true, clientId: newClientId });
  } catch (error) {
    console.error("Error transferring policy:", error);
    return NextResponse.json({ error: "Failed to transfer policy" }, { status: 500 });
  }
}
