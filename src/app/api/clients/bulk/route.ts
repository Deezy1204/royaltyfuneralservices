
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { ref, get, push, set, query, orderByChild, equalTo, update } from "firebase/database";
import { getCurrentUser, createAuditLog } from "@/lib/auth";
import { generateNumber, sanitizeForFirebase } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clients } = await request.json();
    if (!Array.isArray(clients)) {
      return NextResponse.json({ error: "Invalid data format. Expected an array of clients." }, { status: 400 });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    const oldClientsRef = ref(db, 'OldClients');
    const oldPoliciesRef = ref(db, 'OldPolicies');

    console.log(`Starting bulk import of ${clients.length} clients`);

    for (const clientData of clients) {
      try {
        // Skip if basically empty (no main fields AND no extra fields)
        const hasMainFields = clientData.firstName || clientData.lastName || clientData.idNumber;
        const hasExtraFields = clientData.extraFields && Object.keys(clientData.extraFields).length > 0;
        const hasPolicyData = clientData.policyData && (clientData.policyData.planType || clientData.policyData.policyNumber);

        if (!hasMainFields && !hasExtraFields && !hasPolicyData) {
          continue;
        }

        const clientNumber = generateNumber("OLD");
        
        const createdAt = clientData.policyData?.inceptionDate || new Date().toISOString();
        
        const newClient = {
          ...clientData,
          clientNumber,
          createdAt,
          importedAt: new Date().toISOString(),
          importedBy: user.userId,
          isActive: true,
          isOldClient: true
        };

        const newClientRef = push(oldClientsRef);
        const clientId = newClientRef.key;
        await set(newClientRef, sanitizeForFirebase(newClient));

        // Handle policy data if it exists in the mapped object
        if (clientData.policyData && (clientData.policyData.planType || clientData.policyData.policyNumber)) {
            const policyNumber = clientData.policyData.policyNumber || generateNumber("OPOL");
            const newPolicy = {
                ...clientData.policyData,
                policyNumber,
                clientId: clientId,
                createdAt: new Date().toISOString(),
                createdBy: user.userId,
                status: clientData.policyData.status || "Active",
                isOldPolicy: true
            };
            const newPolicyRef = push(oldPoliciesRef);
            await set(newPolicyRef, sanitizeForFirebase(newPolicy));
        }

        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(err.message);
      }
    }

    await createAuditLog(
      user.userId,
      "BULK_CREATE",
      "client",
      "multiple",
      "Client",
      null,
      { count: results.success },
      `Bulk imported ${results.success} clients from Excel`
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error in bulk upload:", error);
    return NextResponse.json({ error: "Failed to process bulk upload" }, { status: 500 });
  }
}
