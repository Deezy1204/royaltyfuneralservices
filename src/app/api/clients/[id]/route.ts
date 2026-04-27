
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, set, remove, child, update } from "firebase/database";
import { getCurrentUser, createAuditLog } from "@/lib/auth";
import { sanitizeForFirebase } from "@/lib/utils";

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
    const clientSnap = await get(child(ref(db), `clients/${id}`));
    if (!clientSnap.exists() || clientSnap.val().deletedAt) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const clientData = { id, ...clientSnap.val() };

    // Fetch policies for this client
    const policiesSnap = await get(ref(db, "policies"));
    const policies: any[] = [];
    if (policiesSnap.exists()) {
      policiesSnap.forEach((child) => {
        const pol = child.val();
        if (!pol.deletedAt && pol.clientId === id) {
          policies.push({ id: child.key, ...pol });
        }
      });
    }

    // Fetch claims for this client
    const claimsSnap = await get(ref(db, "claims"));
    const claims: any[] = [];
    if (claimsSnap.exists()) {
      claimsSnap.forEach((child) => {
        const claim = child.val();
        if (!claim.deletedAt && claim.clientId === id) {
          claims.push({ id: child.key, ...claim });
        }
      });
    }

    // Fetch payments for this client
    const paymentsSnap = await get(ref(db, "payments"));
    const payments: any[] = [];
    if (paymentsSnap.exists()) {
      paymentsSnap.forEach((child) => {
        const payment = child.val();
        if (!payment.deletedAt && payment.clientId === id) {
          payments.push({ id: child.key, ...payment });
        }
      });
    }

    return NextResponse.json({
      client: { ...clientData, policies, claims, payments },
    });
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
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
    const clientSnap = await get(child(ref(db), `clients/${id}`));
    if (!clientSnap.exists() || clientSnap.val().deletedAt) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const previousData = clientSnap.val();
    const body = await request.json();

    const updatedClient = {
      ...previousData,
      title: body.title ?? previousData.title,
      firstName: body.firstName ?? previousData.firstName,
      middleName: body.middleName ?? previousData.middleName,
      lastName: body.lastName ?? previousData.lastName,
      idNumber: body.idNumber ?? previousData.idNumber,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth).toISOString() : previousData.dateOfBirth,
      gender: body.gender ?? previousData.gender,
      maritalStatus: body.maritalStatus ?? previousData.maritalStatus,
      phone: body.phone ?? previousData.phone,
      altPhone: body.altPhone ?? previousData.altPhone,
      email: body.email ?? previousData.email,
      address: body.address ?? previousData.address,
      streetAddress: body.streetAddress ?? body.address ?? previousData.streetAddress,
      suburb: body.suburb ?? previousData.suburb,
      city: body.city ?? previousData.city,
      province: body.province ?? previousData.province,
      postalCode: body.postalCode ?? previousData.postalCode,
      country: body.country ?? previousData.country,
      occupation: body.occupation ?? previousData.occupation,
      employer: body.employer ?? previousData.employer,
      employerAddress: body.employerAddress ?? previousData.employerAddress,
      bankName: body.bankName ?? previousData.bankName,
      accountNumber: body.accountNumber ?? previousData.accountNumber,
      branchCode: body.branchCode ?? previousData.branchCode,
      accountType: body.accountType ?? previousData.accountType,
      isActive: body.isActive !== undefined ? body.isActive : previousData.isActive,
      updatedAt: new Date().toISOString(),
      updatedBy: user.userId,
    };

    const updates: any = {};
    updates[`clients/${id}`] = sanitizeForFirebase(updatedClient);

    // If policy update requested
    if (body.policyId) {
      const polRef = child(ref(db), `policies/${body.policyId}`);
      const polSnap = await get(polRef);
      if (polSnap.exists()) {
        const previousPolicy = polSnap.val();
        const updatedPolicy = {
          ...previousPolicy,
          planType: body.planType ?? previousPolicy.planType,
          planServiceType: body.planServiceType ?? previousPolicy.planServiceType,
          paymentFrequency: body.paymentFrequency ?? previousPolicy.paymentFrequency,
          premiumAmount: body.premiumAmount !== undefined ? Number(body.premiumAmount) : previousPolicy.premiumAmount,
          status: body.status ?? previousPolicy.status,
          paymentMethod: body.paymentMethod ?? previousPolicy.paymentMethod,
          notes: body.notes ?? previousPolicy.notes,
          updatedAt: new Date().toISOString(),
          updatedBy: user.userId,
        };
        updates[`policies/${body.policyId}`] = sanitizeForFirebase(updatedPolicy);

        await createAuditLog(
          user.userId, "UPDATE", "policy", body.policyId, "Policy",
          previousPolicy, updatedPolicy, `Updated policy ${previousPolicy.policyNumber} via client edit`
        );
      }
    }

    await update(ref(db), updates);

    await createAuditLog(
      user.userId,
      "UPDATE",
      "client",
      id,
      "Client",
      previousData,
      updatedClient,
      `Updated client: ${updatedClient.firstName} ${updatedClient.lastName}`
    );

    return NextResponse.json({ client: { id, ...updatedClient } });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const clientSnap = await get(child(ref(db), `clients/${id}`));
    if (!clientSnap.exists()) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Soft delete
    const existing = clientSnap.val();
    await set(ref(db, `clients/${id}`), sanitizeForFirebase({
      ...existing,
      deletedAt: new Date().toISOString(),
      deletedBy: user.userId,
      isActive: false,
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}
