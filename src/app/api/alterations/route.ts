
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, push, set, child } from "firebase/database";
import { getCurrentUser, createAuditLog } from "@/lib/auth";
import { generateNumber, addMonths, addDays, sanitizeForFirebase } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || "";

    const alterationsRef = ref(db, 'alterations');
    const snapshot = await get(alterationsRef);
    let alterations: any[] = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const alteration = childSnapshot.val();
        alterations.push({ id: childSnapshot.key, ...alteration });
      });
    }

    // Filter
    alterations = alterations.filter(a => !a.deletedAt);

    if (status && status !== "all") {
      alterations = alterations.filter(a => a.status === status.toUpperCase());
    }

    // Sort
    alterations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const total = alterations.length;
    const startIndex = (page - 1) * limit;
    const paginatedAlterations = alterations.slice(startIndex, startIndex + limit);

    // Enhance
    const enhancedAlterations = await Promise.all(paginatedAlterations.map(async (alt) => {
      let policy: any = { policyNumber: "N/A", planType: "N/A", client: { firstName: "", lastName: "", clientNumber: "" } };
      let createdBy = { firstName: "Unknown", lastName: "User" };
      let approvedBy = { firstName: "", lastName: "" };

      if (alt.policyId) {
        const policySnap = await get(child(ref(db), `policies/${alt.policyId}`));
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

      if (alt.createdById) {
        const uSnap = await get(child(ref(db), `users/${alt.createdById}`));
        if (uSnap.exists()) createdBy = uSnap.val();
      }

      if (alt.approvedById) {
        const uSnap = await get(child(ref(db), `users/${alt.approvedById}`));
        if (uSnap.exists()) approvedBy = uSnap.val();
      }

      return {
        ...alt,
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
    }));

    // Calculate Summary Stats
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let pendingReview = 0;
    let upgradesMonth = 0;
    let downgradesMonth = 0;
    let dependentsAdded = 0;

    alterations.forEach(a => {
      const aDate = new Date(a.createdAt);
      const isThisMonth = aDate.getTime() >= monthStart;

      if (a.status === "SUBMITTED" || a.status === "PENDING") pendingReview++;

      if (isThisMonth) {
        if (a.alterationType === "UPGRADE") upgradesMonth++;
        if (a.alterationType === "DOWNGRADE") downgradesMonth++;
        if (a.alterationType === "ADD_DEPENDENT") dependentsAdded++;
      }
    });

    return NextResponse.json({
      alterations: enhancedAlterations,
      summary: {
        pendingReview,
        upgradesMonth,
        downgradesMonth,
        dependentsAdded
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching alterations:", error);
    return NextResponse.json({ error: "Failed to fetch alterations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const alterationNumber = generateNumber("ALT");

    const policySnap = await get(child(ref(db), `policies/${body.policyId}`));
    if (!policySnap.exists()) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }
    const policy = policySnap.val();

    const previousValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    // Capture changes based on alteration type
    if (body.alterationType === "UPGRADE" || body.alterationType === "DOWNGRADE") {
      previousValues.planType = policy.planType;
      previousValues.premiumAmount = policy.premiumAmount;
      previousValues.coverAmount = policy.coverAmount;
      newValues.planType = body.newPlan;
      newValues.premiumAmount = body.newPremium;
      newValues.coverAmount = body.newCover;
    }

    const newAlteration = {
      alterationNumber,
      policyId: body.policyId,
      alterationType: body.alterationType,
      previousValues: JSON.stringify(previousValues),
      newValues: JSON.stringify(newValues),
      dependentId: body.dependentId || null,
      dependentName: body.dependentName || null,
      dependentDOB: body.dependentDOB || null,
      beneficiaryId: body.beneficiaryId || null,
      beneficiaryName: body.beneficiaryName || null,
      beneficiaryDOB: body.beneficiaryDOB || null,
      beneficiaryProportion: body.beneficiaryProportion || null,
      beneficiaryRelationship: body.beneficiaryRelationship || null,
      previousPlan: body.alterationType.includes("GRADE") ? policy.planType : null,
      newPlan: body.newPlan || null,
      previousPremium: policy.premiumAmount || null,
      newPremium: body.newPremium || null,
      previousCover: policy.coverAmount || null,
      newCover: body.newCover || null,
      riderType: body.riderType || null,
      newPaymentMethod: body.newPaymentMethod || null,
      newBankName: body.newBankName || null,
      newAccountNumber: body.newAccountNumber || null,
      newBranchCode: body.newBranchCode || null,
      newDebitDay: body.newDebitDay || null,
      changeField: body.changeField || null,
      changeValue: body.changeValue || null,
      effectiveDate: body.effectiveDate ? new Date(body.effectiveDate).toISOString() : null,
      newWaitingPeriod: body.newWaitingPeriod || false,
      waitingPeriodEnd: body.newWaitingPeriod ? addDays(new Date(), 90).toISOString() : null,
      status: "SUBMITTED",
      createdById: user.userId,
      createdAt: new Date().toISOString(),
      notes: body.notes || "",
    };

    const altRef = ref(db, 'alterations');
    const newAltRef = push(altRef);
    await set(newAltRef, sanitizeForFirebase(newAlteration));
    const alterationId = newAltRef.key;

    await createAuditLog(
      user.userId,
      "CREATE",
      "alteration",
      alterationId!,
      "Alteration",
      null,
      newAlteration,
      `Created alteration ${alterationNumber} - ${body.alterationType}`
    );

    return NextResponse.json({ alteration: { id: alterationId, ...newAlteration } }, { status: 201 });
  } catch (error) {
    console.error("Error creating alteration:", error);
    return NextResponse.json({ error: "Failed to create alteration" }, { status: 500 });
  }
}
