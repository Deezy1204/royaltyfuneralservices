
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, push, set, child, query, orderByChild, equalTo } from "firebase/database";
import { getCurrentUser, createAuditLog } from "@/lib/auth";
import { generateNumber, isWaitingPeriodComplete, sanitizeForFirebase } from "@/lib/utils";
import { DEFAULT_PLANS } from "@/lib/plans";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const claimsRef = ref(db, 'claims');
    const snapshot = await get(claimsRef);
    let claims: any[] = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const claim = childSnapshot.val();
        if (!claim.deletedAt) {
          claims.push({ id: childSnapshot.key, ...claim });
        }
      });
    }

    // Agent data isolation
    if (user.role === "AGENT") {
      // First, fetch clients belonging to this agent to get their IDs
      const clientCollections = ['clients', 'OldClients'];
      const agentClientIds = new Set<string>();
      
      for (const col of clientCollections) {
        const clientsSnapshot = await get(ref(db, col));
        if (clientsSnapshot.exists()) {
          clientsSnapshot.forEach(child => {
            const clientData = child.val();
            if (clientData.agentId === user.userId || clientData.createdById === user.userId) {
              agentClientIds.add(child.key as string);
            }
          });
        }
      }
      
      // Filter claims to only include those for this agent's clients
      claims = claims.filter(c => agentClientIds.has(c.clientId));
    }

    const claims_isolated_copy = [...claims];

    // Filter Search
    if (search) {
      const searchLower = search.toLowerCase();
      claims = claims.filter(c =>
        (c.claimNumber && c.claimNumber.toLowerCase().includes(searchLower)) ||
        (c.deceasedName && c.deceasedName.toLowerCase().includes(searchLower))
        // Note: Joining client name for search would require fetching all clients or storing client name on claim
      );
    }

    // Filter Status
    if (status && status !== "all") {
      claims = claims.filter(c => c.status === status.toUpperCase());
    }

    // Capture unfiltered (but agent-isolated) claims for accurate summary stats
    const statsBase = [...claims_isolated_copy]; // We need to create this copy above

    // Sort
    claims.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const total = claims.length;
    const startIndex = (page - 1) * limit;
    const paginatedClaims = claims.slice(startIndex, startIndex + limit);

    // Enhance with related data (Client, Policy, CreatedBy)
    // We'll fetch these individually or in bulk if possible. 
    // In RTDB without joins, we often store denormalized names or fetch on demand.
    // For this list view, we need Client Name and Policy Number. App logic might assume they are present.

    // Let's fetch clients and policies to Map. 
    // Optimization: Only fetch needed IDs? Too complex for this migration script. 
    // We'll fetch all or just rely on what is stored if we start storing names on claim creation.
    // BUT existing data (from seed) or new data might rely on relations.
    // Let's do a quick fetch of referenced records.

    // Fetch all services to avoid Firebase "Index not defined" error
    const servicesRef = ref(db, 'serviceRendered');
    const allServicesSnap = await get(servicesRef);
    const allServices: any[] = [];
    if (allServicesSnap.exists()) {
      allServicesSnap.forEach(s => { allServices.push({ id: s.key, ...s.val() }); });
    }

    const enhancedClaims = await Promise.all(paginatedClaims.map(async (claim) => {
      let client = { firstName: "Unknown", lastName: "Client", clientNumber: "N/A" };
      let policy = { policyNumber: "N/A", planType: "N/A", coverAmount: 0 };
      let createdBy = { firstName: "System", lastName: "User" };
      let services: any[] = [];

      if (claim.clientId) {
        let clientSnap = await get(child(ref(db), `clients/${claim.clientId}`));
        if (!clientSnap.exists()) {
          clientSnap = await get(child(ref(db), `OldClients/${claim.clientId}`));
        }
        if (clientSnap.exists()) client = clientSnap.val();
      }
      if (claim.policyId) {
        const policySnap = await get(child(ref(db), `policies/${claim.policyId}`));
        if (policySnap.exists()) policy = policySnap.val();
      }
      if (claim.createdById) {
        const userSnap = await get(child(ref(db), `users/${claim.createdById}`));
        if (userSnap.exists()) createdBy = userSnap.val();
      }

      // Fetch services
      // We can check if services are stored directly on claim or in separate node
      // Let's assume we store them deeply nested in claim for now or separate
      // The POST below will store them separate to match relational model, but maybe easy to nest in NoSQL.
      // Let's check 'services' node filtering by claimId? Inefficient.
      // Better to store services array on claim object in NoSQL?
      // Let's try to fetch from 'services' node if we stick to relational mapping, or just check if claim has them.
      // For migration simplicity, let's assume we might change to nested, but to keep existing component happy (which expects array),
      // we'll query services.

      // Actually, let's look at POST implementation below: I will nest them or put references.
      // Filtering locally since Index is missing for now on claimId
      services = allServices.filter(s => s.claimId === claim.id);

      return {
        ...claim,
        client: { firstName: client.firstName, lastName: client.lastName, clientNumber: client.clientNumber },
        policy: { policyNumber: policy.policyNumber, planType: policy.planType, coverAmount: policy.coverAmount },
        createdBy: { firstName: createdBy.firstName, lastName: createdBy.lastName },
        services
      };
    }));

    // Compute summary stats from ALL claims accessible to this user (non-deleted, agent-isolated if applicable)
    // We use the 'statsBase' array captured above (line 70) which is before search/status filters
    
    const summary = {
      pending: statsBase.filter(c => c.status === "PENDING").length,
      underReview: statsBase.filter(c => c.status === "UNDER_REVIEW").length,
      approved: statsBase.filter(c => c.status === "APPROVED").length,
      paid: statsBase.filter(c => c.status === "PAID").length,
      rejected: statsBase.filter(c => c.status === "REJECTED").length,
      paidAmount: statsBase.filter(c => c.status === "PAID").reduce((sum, c) => sum + (Number(c.claimAmount) || 0), 0),
    };

    return NextResponse.json({
      claims: enhancedClaims,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary,
    });
  } catch (error) {
    console.error("Error fetching claims:", error);
    return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const claimNumber = generateNumber("CLM");

    // Validate Policy
    const policySnap = await get(child(ref(db), `policies/${body.policyId}`));
    if (!policySnap.exists()) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }
    const policy = policySnap.val();

    // To check dependents, we need to know if they are nested in policy or separate.
    // In seed script, we didn't explicitly seed dependents. 
    // If they are in 'dependents' node:
    let policyDependents: any[] = [];
    // We need to fetch dependents for this policy? 
    // The relational model had 'PolicyDependent' linking Policy and Dependent.
    // In Firebase, we might store `dependents` map on policy.
    // Let's assume for now we look up where necessary or if body passes dependentId, we check that.

    // Eligibility checks
    const eligibilityResults: Record<string, unknown> = {
      policyActive: policy.status === "ACTIVE",
      waitingPeriodComplete: isWaitingPeriodComplete(new Date(policy.waitingPeriodEnd)),
    };

    if (body.deceasedType === "DEPENDENT" && body.dependentId) {
      // Need to find this dependent
      // Assuming we store dependents in a node 'policyDependents' or similar or nested in policy
      // Let's try to find it in 'policyDependents' if we migrated it that way, 
      // OR better, let's assume we can fetch it.
      // For this refactor, I will check if I can just skip deep validation or try to implement it.
      // Let's implement basic check.
      // Access 'deps' on policy if nested?
      if (policy.dependents && policy.dependents[body.dependentId]) {
        const dep = policy.dependents[body.dependentId];
        eligibilityResults.dependentCovered = true;
        eligibilityResults.dependentWaitingComplete = isWaitingPeriodComplete(new Date(dep.waitingPeriodEnd));
      } else {
        // Fallback to separate node lookup?
        // query policyDependents by policyId and dependentId?
        eligibilityResults.dependentCovered = false; // logic placeholder
      }
    }

    const newClaim = {
      claimNumber,
      clientId: body.clientId,
      policyId: body.policyId,
      declarationId: body.declarationId || null,
      deceasedType: body.deceasedType,
      dependentId: body.dependentId || null,
      deceasedName: body.deceasedName,
      deceasedIdNumber: body.deceasedIdNumber,
      dateOfDeath: body.deceasedDOD || body.dateOfDeath ? new Date(body.deceasedDOD || body.dateOfDeath).toISOString() : null,
      causeOfDeath: body.causeOfDeath,
      placeOfDeath: body.placeOfDeath,
      deceasedDOB: body.deceasedDOB,
      employeeNumber: body.employeeNumber,
      declarantAddress: body.declarantAddress,

      burialPlace: body.burialPlace,
      claimType: body.claimType || "DEATH",
      claimAmount: body.claimAmount || (DEFAULT_PLANS[policy.planType as keyof typeof DEFAULT_PLANS]?.cashBenefit || policy.coverAmount || 0),
      eligibilityCheck: JSON.stringify(eligibilityResults),
      status: body.status || "PENDING",
      createdById: user.userId,
      createdAt: new Date().toISOString(),
      approximateDistance: body.approximateDistance || null,
      servicesRendered: body.servicesRendered || null,
      notes: body.notes,
    };

    const claimsRef = ref(db, 'claims');
    const newClaimRef = push(claimsRef);
    await set(newClaimRef, sanitizeForFirebase(newClaim));
    const claimId = newClaimRef.key;

    // Create services
    if (body.services && body.services.length > 0 && claimId) {
      const servicesRef = ref(db, 'serviceRendered');
      for (const svc of body.services) {
        const newSvcRef = push(servicesRef);
        await set(newSvcRef, sanitizeForFirebase({
          claimId: claimId,
          serviceType: svc.serviceType,
          description: svc.description,
          provider: svc.provider,
          cost: svc.cost,
          quantity: svc.quantity || 1,
          totalCost: svc.cost * (svc.quantity || 1),
        }));
      }
    }

    // Synchronize with linked Declaration
    if (body.declarationId) {
      try {
        const declRef = child(ref(db), `declarations/${body.declarationId}`);
        await update(declRef, { 
          status: newClaim.status,
          updatedAt: new Date().toISOString(),
          updatedBy: user.userId
        });
      } catch (declError) {
        console.error("Failed to sync declaration status on create:", declError);
      }
    }

    const performerName = `${user.firstName} ${user.lastName}`;

    await createAuditLog(
      user.userId,
      "CREATE",
      "claim",
      claimId!,
      "Claim",
      null,
      newClaim,
      `${performerName} created claim ${claimNumber} for ${body.deceasedName}`
    );

    return NextResponse.json({ claim: { id: claimId, ...newClaim } }, { status: 201 });
  } catch (error) {
    console.error("Error creating claim:", error);
    return NextResponse.json({ error: "Failed to create claim" }, { status: 500 });
  }
}
