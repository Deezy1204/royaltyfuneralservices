
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, push, set, child, update } from "firebase/database";
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
    const clientId = searchParams.get("clientId") || "";

    const [paymentsSnap, oldPaymentsSnap] = await Promise.all([
      get(ref(db, 'payments')),
      get(ref(db, 'OldPayments'))
    ]);
    let payments: any[] = [];

    if (paymentsSnap.exists()) {
      paymentsSnap.forEach((childSnapshot) => {
        const p = childSnapshot.val();
        if (!p.deletedAt) {
          payments.push({ id: childSnapshot.key, ...p });
        }
      });
    }

    if (oldPaymentsSnap.exists()) {
      oldPaymentsSnap.forEach((childSnapshot) => {
        const p = childSnapshot.val();
        if (!p.deletedAt) {
          payments.push({ id: childSnapshot.key, ...p, isOldPayment: true });
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
      
      // Filter payments to only include those for this agent's clients
      payments = payments.filter(p => agentClientIds.has(p.clientId));
    }

    // Enhance first so we can search on client details
    let enhancedPayments = await Promise.all(payments.map(async (pay) => {
      let client = { firstName: "", lastName: "", clientNumber: "", idNumber: "" };
      let policy = { policyNumber: "", planType: "" };
      let receivedBy = { firstName: "", lastName: "" };

      if (pay.clientId) {
        let s = await get(child(ref(db), `clients/${pay.clientId}`));
        if (!s.exists()) {
          s = await get(child(ref(db), `OldClients/${pay.clientId}`));
        }
        if (s.exists()) client = s.val();
      }
      if (pay.policyId) {
        let s = await get(child(ref(db), `policies/${pay.policyId}`));
        if (!s.exists()) {
          s = await get(child(ref(db), `OldPolicies/${pay.policyId}`));
        }
        if (s.exists()) policy = s.val();
      }
      if (pay.receivedById) {
        const s = await get(child(ref(db), `users/${pay.receivedById}`));
        if (s.exists()) receivedBy = s.val();
      }

      return {
        ...pay,
        client: { firstName: client.firstName, lastName: client.lastName, clientNumber: client.clientNumber, idNumber: client.idNumber },
        policy: { policyNumber: policy.policyNumber, planType: policy.planType },
        receivedBy: { firstName: receivedBy.firstName, lastName: receivedBy.lastName }
      };
    }));

    if (search) {
      const searchLower = search.toLowerCase();
      enhancedPayments = enhancedPayments.filter(p =>
        (p.paymentNumber && p.paymentNumber.toLowerCase().includes(searchLower)) ||
        (p.receiptNumber && p.receiptNumber.toLowerCase().includes(searchLower)) ||
        (p.client.firstName && p.client.firstName.toLowerCase().includes(searchLower)) ||
        (p.client.lastName && p.client.lastName.toLowerCase().includes(searchLower)) ||
        (p.client.clientNumber && p.client.clientNumber.toLowerCase().includes(searchLower)) ||
        (p.client.idNumber && p.client.idNumber.toLowerCase().includes(searchLower))
      );
    }

    if (status && status !== "all") {
      enhancedPayments = enhancedPayments.filter(p => p.status === status.toUpperCase());
    }

    if (clientId) {
      enhancedPayments = enhancedPayments.filter(p => p.clientId === clientId);
    }

    // Sort
    enhancedPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    // Pagination
    const total = enhancedPayments.length;
    const startIndex = (page - 1) * limit;
    const paginatedPayments = enhancedPayments.slice(startIndex, startIndex + limit);

    // Calculate Summary Stats
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let todayTotal = 0;
    let monthTotal = 0;
    let pendingCount = 0;

    payments.forEach(p => {
      const pDate = new Date(p.paymentDate);
      const isToday = p.paymentDate && p.paymentDate.startsWith(todayStr);
      const isThisMonth = pDate.getTime() >= monthStart;

      if (p.status === "CONFIRMED") {
        if (isToday) todayTotal += (Number(p.amount) || 0);
        if (isThisMonth) monthTotal += (Number(p.amount) || 0);
      } else if (p.status === "PENDING") {
        pendingCount++;
      }
    });

    return NextResponse.json({
      payments: paginatedPayments,
      summary: {
        todayTotal,
        monthTotal,
        pendingCount
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const paymentNumber = generateNumber("PAY");
    const receiptNumber = body.receiptNumber || generateNumber("REC");

    const isAgent = user.role === "AGENT";
    const status = isAgent ? "PENDING" : "CONFIRMED";

    const payment = {
      paymentNumber,
      clientId: body.clientId,
      policyId: body.policyId,
      amount: parseFloat(body.amount),
      paymentDate: new Date(body.paymentDate).toISOString(),
      paymentMethod: body.paymentMethod,
      referenceNumber: body.referenceNumber,
      receiptNumber,
      receiptDate: new Date().toISOString(),
      periodStart: body.periodStart ? new Date(body.periodStart).toISOString() : null,
      periodEnd: body.periodEnd ? new Date(body.periodEnd).toISOString() : null,
      monthsIncluded: body.monthsIncluded || 1,
      monthsCovered: body.monthsCovered || "",
      amountInWords: body.amountInWords || null,
      status: status,
      confirmedAt: status === "CONFIRMED" ? new Date().toISOString() : null,
      confirmedById: status === "CONFIRMED" ? user.userId : null,
      receivedById: user.userId,
      currency: body.currency || "USD",
      adminSignature: body.adminSignature || null,
      clientSignature: body.clientSignature || null,
      proofOfPayment: body.proofOfPayment || null,
      notes: body.notes || "",
      createdAt: new Date().toISOString()
    };

    const paymentsRef = ref(db, 'payments');
    const newPayRef = push(paymentsRef);
    await set(newPayRef, sanitizeForFirebase(payment));
    const paymentId = newPayRef.key;

    // Update policy: lastPaymentDate and arrears deduction - ONLY IF CONFIRMED
    if (status === "CONFIRMED") {
      const policyRef = child(ref(db), `policies/${body.policyId}`);
      const policySnap = await get(policyRef);

      if (policySnap.exists()) {
        await update(policyRef, {
          lastPaymentDate: new Date(body.paymentDate).toISOString(),
        });
      }
    }

    // Fetch client name for log
    let clientName = "Unknown Client";
    const clientSnap = await get(child(ref(db), `clients/${body.clientId}`));
    if (clientSnap.exists()) {
      clientName = `${clientSnap.val().firstName} ${clientSnap.val().lastName}`;
    } else {
      const oldClientSnap = await get(child(ref(db), `OldClients/${body.clientId}`));
      if (oldClientSnap.exists()) {
        clientName = `${oldClientSnap.val().firstName} ${oldClientSnap.val().lastName}`;
      }
    }

    const performerName = `${user.firstName} ${user.lastName}`;

    await createAuditLog(
      user.userId,
      "CREATE",
      "payment",
      paymentId!,
      "Payment",
      null,
      payment,
      `${performerName} recorded payment ${paymentNumber} of ${payment.currency} ${payment.amount} for client ${clientName}`
    );

    return NextResponse.json({ payment: { id: paymentId, ...payment } }, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
