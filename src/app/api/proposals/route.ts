
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, push, set, child } from "firebase/database";
import { getCurrentUser, createAuditLog } from "@/lib/auth";
import { generateNumber, sanitizeForFirebase } from "@/lib/utils";

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

    const proposalsRef = ref(db, 'proposals');
    const snapshot = await get(proposalsRef);
    let proposals: any[] = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const proposal = childSnapshot.val();
        proposals.push({ id: childSnapshot.key, ...proposal });
      });
    }

    // Filter
    proposals = proposals.filter(p => !p.deletedAt);

    // Filter by agent if applicable
    if (user.role === "AGENT") {
      proposals = proposals.filter(p => p.agentId === user.userId || p.createdBy === user.userId);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      proposals = proposals.filter(p =>
        (p.proposalNumber && p.proposalNumber.toLowerCase().includes(searchLower)) ||
        (p.clientFirstName && p.clientFirstName.toLowerCase().includes(searchLower)) ||
        (p.clientLastName && p.clientLastName.toLowerCase().includes(searchLower)) ||
        (p.clientIdNumber && p.clientIdNumber.toLowerCase().includes(searchLower))
      );
    }

    if (status && status !== "all") {
      proposals = proposals.filter(p => p.status === status.toUpperCase());
    }

    // Sort
    proposals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const total = proposals.length;
    const startIndex = (page - 1) * limit;
    const paginatedProposals = proposals.slice(startIndex, startIndex + limit);

    // Enhance with Agent and Client number if needed
    // Proposals store client snapshot info usually, but maybe we want linked client number?
    // The previous implementation fetched client.clientNumber.
    // In our seed/POST, we store clientId if linked.

    const enhancedProposals = await Promise.all(paginatedProposals.map(async (prop) => {
      let agent = { firstName: "Unknown", lastName: "Agent" };
      let client = { clientNumber: "N/A" };

      if (prop.agentId) {
        const agentSnap = await get(child(ref(db), `users/${prop.agentId}`));
        if (agentSnap.exists()) {
          const aData = agentSnap.val();
          if (!aData.deletedAt && aData.isActive) {
            agent = { firstName: aData.firstName, lastName: aData.lastName };
          } else {
            agent = { firstName: "System", lastName: "Administrator" };
          }
        }
      }

      if (prop.clientId) {
        let clientSnap = await get(child(ref(db), `clients/${prop.clientId}`));
        if (!clientSnap.exists()) {
          clientSnap = await get(child(ref(db), `OldClients/${prop.clientId}`));
        }
        if (clientSnap.exists()) client = clientSnap.val();
      }

      return {
        ...prop,
        agent: { firstName: agent.firstName, lastName: agent.lastName },
        client: { clientNumber: client.clientNumber }
      };
    }));

    return NextResponse.json({
      proposals: enhancedProposals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json({ error: "Failed to fetch proposals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const proposalNumber = generateNumber("PROP");

    const newProposal = {
      proposalNumber,
      clientId: body.clientId || null,
      agentId: user.userId,
      agentCode: body.agentCode,
      policyType: body.policyType,
      planServiceType: body.planServiceType || "SERVICE",
      planType: body.planType,
      proposedPremium: parseFloat(body.proposedPremium) || 0,
      clientTitle: body.clientTitle,
      clientFirstName: body.clientFirstName,
      clientLastName: body.clientLastName,
      clientIdNumber: body.clientIdNumber || null,
      clientDOB: body.clientDOB ? new Date(body.clientDOB).toISOString() : null,
      clientGender: body.clientGender,
      clientPhone: body.clientPhone,
      clientEmail: body.clientEmail,
      clientAddress: body.clientAddress,
      clientCity: body.clientCity,
      clientPostalCode: body.clientPostalCode,
      dependentsData: body.dependents ? JSON.stringify(body.dependents) : null,
      beneficiariesData: body.beneficiaries ? JSON.stringify(body.beneficiaries) : null,
      paymentFrequency: body.paymentFrequency,
      paymentMethod: body.paymentMethod,
      bankName: body.bankName,
      accountNumber: body.accountNumber,
      branchCode: body.branchCode,
      debitOrderDay: body.debitOrderDay ? parseInt(body.debitOrderDay) : null,
      status: body.status || "DRAFT",
      notes: body.notes,
      isInsured: body.isInsured || "No",
      maritalStatus: body.maritalStatus || null,
      clientSignature: body.clientSignature || null,
      createdAt: new Date().toISOString(),
      createdBy: user.userId
    };

    const proposalsRef = ref(db, 'proposals');
    const newProposalRef = push(proposalsRef);
    await set(newProposalRef, sanitizeForFirebase(newProposal));
    const proposalId = newProposalRef.key;

    await createAuditLog(
      user.userId,
      "CREATE",
      "proposal",
      proposalId!,
      "Proposal",
      null,
      newProposal,
      `Created proposal ${proposalNumber} for ${body.clientFirstName} ${body.clientLastName}`
    );

    return NextResponse.json({ proposal: { id: proposalId, ...newProposal } }, { status: 201 });
  } catch (error) {
    console.error("Error creating proposal:", error);
    return NextResponse.json({ error: "Failed to create proposal" }, { status: 500 });
  }
}
