import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, child, update, query, orderByChild, equalTo } from "firebase/database";
import { getCurrentUser, createAuditLog } from "@/lib/auth";
import { sanitizeForFirebase } from "@/lib/utils";
import { differenceInDays } from "date-fns";

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

    const claimSnap = await get(child(ref(db), `claims/${id}`));
    if (!claimSnap.exists()) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }
    const claimData = claimSnap.val();
    if (claimData.deletedAt) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Relations
    let client = {};
    let policy = {};
    let dependent = {};
    let declaration = {};
    let services: any[] = [];
    let createdBy = {};
    let approvedBy = {};

    if (claimData.clientId) {
      const s = await get(child(ref(db), `clients/${claimData.clientId}`));
      if (s.exists()) client = s.val();
    }
    if (claimData.policyId) {
      const s = await get(child(ref(db), `policies/${claimData.policyId}`));
      if (s.exists()) policy = s.val();
    }
    if (claimData.dependentId && policy && (policy as any).dependents) {
      // Look up in policy dependents map
      dependent = (policy as any).dependents[claimData.dependentId] || {};
    }
    if (claimData.declarationId) {
      const s = await get(child(ref(db), `declarations/${claimData.declarationId}`));
      if (s.exists()) declaration = s.val();
    }
    if (claimData.createdById) {
      const s = await get(child(ref(db), `users/${claimData.createdById}`));
      if (s.exists()) createdBy = s.val();
    }
    if (claimData.approvedById) {
      const s = await get(child(ref(db), `users/${claimData.approvedById}`));
      if (s.exists()) approvedBy = s.val();
    }

    // Services
    // Query 'serviceRendered' by claimId
    const servicesQuery = query(ref(db, 'serviceRendered'), orderByChild('claimId'), equalTo(id));
    const svcSnap = await get(servicesQuery);
    if (svcSnap.exists()) {
      svcSnap.forEach(s => { services.push({ id: s.key, ...s.val() }); });
    }

    const claim = {
      id,
      ...claimData,
      client,
      policy,
      dependent,
      declaration,
      services,
      createdBy,
      approvedBy,
      documents: []
    };

    return NextResponse.json({ claim });
  } catch (error) {
    console.error("Error fetching claim:", error);
    return NextResponse.json({ error: "Failed to fetch claim" }, { status: 500 });
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

    const claimRef = child(ref(db), `claims/${id}`);
    const claimSnap = await get(claimRef);
    if (!claimSnap.exists()) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }
    const existing = claimSnap.val();

    const updateData: Record<string, any> = {};

    if (body.status) {
      updateData.status = body.status;

      switch (body.status) {
        case "UNDER_REVIEW":
          updateData.reviewStartedAt = new Date().toISOString();
          break;
        case "APPROVED":
          if (existing.policyId) {
            const polRef = child(ref(db), `policies/${existing.policyId}`);
            const polSnap = await get(polRef);
            if (polSnap.exists()) {
              const policyData = polSnap.val();

              if (policyData.status !== "ACTIVE") {
                return NextResponse.json({ error: `Cannot approve. Policy is ${policyData.status}, must be ACTIVE.` }, { status: 400 });
              }

              const inception = new Date(policyData.inceptionDate || policyData.createdAt);
              if (differenceInDays(new Date(), inception) < 90) {
                return NextResponse.json({ error: "Cannot approve. Policy is still in the 90-day waiting period." }, { status: 400 });
              }

              // Check payments
              const paymentsRef = ref(db, 'payments');
              const paymentsSnap = await get(paymentsRef);
              let totalMonthsPaid = 0;

              if (paymentsSnap.exists()) {
                paymentsSnap.forEach(p => {
                  const payData = p.val();
                  if (payData.policyId !== existing.policyId) return;
                  if (payData.status === "CONFIRMED" || payData.status === "COMPLETED" || payData.status === "SUCCESS") {
                    // Extract number of months from monthsCovered if present, else assume 1 month
                    let months = 1;
                    if (payData.monthsCovered) {
                      const match = (payData.monthsCovered as string).match(/(\d+)\s*[M|m]onths?/);
                      if (match && match[1]) {
                        months = parseInt(match[1], 10);
                      } else {
                        // try to split by commas or "And"
                        const parts = (payData.monthsCovered as string).split(/,|and/i);
                        if (parts.length > 1) {
                          months = parts.length;
                        }
                      }
                    }
                    totalMonthsPaid += months;
                  }
                });
              }

              if (totalMonthsPaid < 3) {
                return NextResponse.json({ error: `Cannot approve. Only ${totalMonthsPaid} months of premiums have been paid (minimum 3 required).` }, { status: 400 });
              }

              await update(polRef, { status: "CLAIMED" });
            }
          }

          updateData.approvedAt = new Date().toISOString();
          updateData.approvedById = user.userId;
          updateData.approvedAmount = body.approvedAmount || existing.claimAmount;
          break;
        case "REJECTED":
          updateData.rejectedAt = new Date().toISOString();
          updateData.rejectionReason = body.rejectionReason;
          break;
        case "PAID":
          updateData.paidAt = new Date().toISOString();
          break;
        case "COMPLETED":
          updateData.completedAt = new Date().toISOString();
          break;
      }
    }

    const editableFields = [
      "clientId", "policyId", "declarationId", "deceasedType", "dependentId",
      "deceasedName", "deceasedIdNumber", "causeOfDeath", "placeOfDeath",
      "deceasedDOB", "employeeNumber", "declarantAddress", 
      "burialPlace", "claimType", "claimAmount", 
      "approximateDistance", "servicesRendered", "notes", "internalNotes",
      "declarantName", "declarantIdNumber", "declarantRelation"
    ];

    editableFields.forEach(field => {
      if (body[field] !== undefined) updateData[field] = body[field];
    });

    if (body.deceasedDOD !== undefined || body.dateOfDeath !== undefined) {
      if (body.deceasedDOD || body.dateOfDeath) {
        updateData.dateOfDeath = new Date(body.deceasedDOD || body.dateOfDeath).toISOString();
      } else {
        updateData.dateOfDeath = null;
      }
    }

    await update(claimRef, sanitizeForFirebase(updateData));

    // Synchronize with linked Declaration if status changed
    if (body.status && existing.declarationId) {
      try {
        const declRef = child(ref(db), `declarations/${existing.declarationId}`);
        const statusMap: Record<string, string> = {
          "APPROVED": "APPROVED",
          "REJECTED": "REJECTED",
          "PAID": "PAID",
          "UNDER_REVIEW": "UNDER_REVIEW",
          "PENDING": "PENDING"
        };
        
        const newDeclStatus = statusMap[body.status];
        if (newDeclStatus) {
          const declUpdates: any = { 
            status: newDeclStatus,
            updatedAt: new Date().toISOString(),
            updatedBy: user.userId
          };
          
          if (newDeclStatus === "APPROVED") {
            declUpdates.approvedAt = new Date().toISOString();
            declUpdates.approvedById = user.userId;
          } else if (newDeclStatus === "REJECTED") {
            declUpdates.rejectedAt = new Date().toISOString();
            declUpdates.rejectedById = user.userId;
          }

          await update(declRef, declUpdates);
        }
      } catch (declError) {
        console.error("Failed to sync declaration status:", declError);
      }
    }

    const updatedClaim = { ...existing, ...updateData, id };

    await createAuditLog(
      user.userId,
      "UPDATE",
      "claim",
      id,
      "Claim",
      existing,
      updatedClaim,
      `Updated claim ${existing.claimNumber} - Status: ${updatedClaim.status}`
    );

    return NextResponse.json({ claim: updatedClaim });
  } catch (error) {
    console.error("Error updating claim:", error);
    return NextResponse.json({ error: "Failed to update claim" }, { status: 500 });
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
    const claimSnap = await get(child(ref(db), `claims/${id}`));
    if (!claimSnap.exists()) return NextResponse.json({ error: "Claim not found" }, { status: 404 });

    const existing = claimSnap.val();
    // Soft delete
    await update(child(ref(db), `claims/${id}`), { deletedAt: new Date().toISOString(), deletedBy: user.userId });

    await createAuditLog(
      user.userId, "DELETE", "claim", id, "Claim", existing, null,
      `Deleted claim ${existing.claimNumber}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting claim:", error);
    return NextResponse.json({ error: "Failed to delete claim" }, { status: 500 });
  }
}
