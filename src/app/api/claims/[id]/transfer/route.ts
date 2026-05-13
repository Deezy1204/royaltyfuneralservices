import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, update, push } from "firebase/database";
import { getCurrentUser, createAuditLog } from "@/lib/auth";
import { sanitizeForFirebase } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["DIRECTOR", "ADMIN", "GENERAL_MANAGER"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params; // This is the CLAIM ID
    const body = await request.json();
    const { action, transferTarget } = body; // transferTarget: { type: "DEPENDENT"|"BENEFICIARY", data: {...} }

    // 1. Get the claim
    const claimSnap = await get(ref(db, `claims/${id}`));
    if (!claimSnap.exists()) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }
    const claimData = claimSnap.val();

    if (!claimData.policyId) {
      return NextResponse.json({ error: "No policy attached to this claim" }, { status: 400 });
    }

    // 2. Get the Policy
    const polRef = ref(db, `policies/${claimData.policyId}`);
    const polSnap = await get(polRef);
    if (!polSnap.exists()) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }
    const policyData = polSnap.val();

    if (action === "TERMINATE") {
      // Just mark policy as TERMINATED
      await update(polRef, {
        status: "TERMINATED",
        terminatedAt: new Date().toISOString(),
        terminationReason: "Claim Paid - Deceased Principal Member",
        transferred: false
      });

      // Delete the old client (deceased principal)
      if (policyData.clientId) {
        await update(ref(db, `clients/${policyData.clientId}`), {
          deletedAt: new Date().toISOString(),
          deletedBy: user.userId,
          status: "DECEASED"
        });
      }

      await update(ref(db, `claims/${id}`), {
        policyActionTaker: user.userId,
        policyActionTaken: "TERMINATED",
        policyActionDate: new Date().toISOString()
      });

      await createAuditLog(
        user.userId,
        "UPDATE",
        "policy",
        claimData.policyId,
        "Policy",
        policyData,
        { ...policyData, status: "TERMINATED" },
        `Terminated policy ${policyData.policyNumber} after claim ${claimData.claimNumber} was paid.`
      );

      return NextResponse.json({ success: true, message: "Policy terminated successfully." });

    } else if (action === "TRANSFER") {
      if (!transferTarget || !transferTarget.data) {
        return NextResponse.json({ error: "Missing transfer target data" }, { status: 400 });
      }

      // Convert the Dependent or Beneficiary into a new Client record
      const newClientRef = push(ref(db, "clients"));
      const newClientId = newClientRef.key;

      const newClientData = {
        firstName: transferTarget.data.firstName || transferTarget.data.name?.split(" ")[0] || "Unknown",
        lastName: transferTarget.data.lastName || transferTarget.data.name?.split(" ").slice(1).join(" ") || "",
        idNumber: transferTarget.data.idNumber || "",
        phone: transferTarget.data.phone || "",
        email: "",
        dateOfBirth: transferTarget.data.dateOfBirth || transferTarget.data.dob || "",
        physicalAddress: policyData.address || claimData.declarantAddress || "",
        createdBy: user.userId,
        createdById: user.userId,
        createdAt: new Date().toISOString(),
        source: "POLICY_TRANSFER",
        isActive: true
      };

      await update(ref(db, `clients/${newClientId}`), sanitizeForFirebase(newClientData));

      // Remove the transferred person from dependents/beneficiaries of the policy
      let updatedDependents = { ...policyData.dependents };
      let updatedBeneficiaries = { ...policyData.beneficiaries };

      if (transferTarget.type === "DEPENDENT" && transferTarget.id) {
         delete updatedDependents[transferTarget.id];
      } else if (transferTarget.type === "BENEFICIARY" && transferTarget.id) {
         delete updatedBeneficiaries[transferTarget.id];
      }

      // 3. Update Policy
      const previousClientId = policyData.clientId;
      const policyUpdate = {
         status: "ACTIVE", // Activate it again for the new client
         clientId: newClientId,
         transferredFrom: previousClientId,
         transferredAt: new Date().toISOString(),
         transferredBy: user.userId,
         dependents: updatedDependents,
         beneficiaries: updatedBeneficiaries
      };

      await update(polRef, sanitizeForFirebase(policyUpdate));

      // Delete the old client (deceased principal)
      if (previousClientId) {
        await update(ref(db, `clients/${previousClientId}`), {
          deletedAt: new Date().toISOString(),
          deletedBy: user.userId,
          status: "DECEASED"
        });
      }
      
      // Update Claim to mark it was handled
      await update(ref(db, `claims/${id}`), {
        policyActionTaker: user.userId,
        policyActionTaken: "TRANSFERRED",
        policyActionDate: new Date().toISOString()
      });

      await createAuditLog(
        user.userId,
        "UPDATE",
        "policy",
        claimData.policyId,
        "Policy",
        policyData,
        { ...policyData, ...policyUpdate },
        `Transferred policy ${policyData.policyNumber} to new principal member (Client ID: ${newClientId}) after claim ${claimData.claimNumber} was paid.`
      );

      return NextResponse.json({ success: true, message: "Policy transferred successfully.", newClientId });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Error handling policy transfer:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
