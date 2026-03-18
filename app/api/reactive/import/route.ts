import { NextRequest, NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth";
import { ImportedOrder, RejectedRow } from "@/lib/reactive-domain";
import { persistImport, readReactiveSnapshot } from "@/lib/reactive-store";

type ImportPayload = {
  fileName: string;
  totalRows: number;
  validOrders: ImportedOrder[];
  rejectedRows: RejectedRow[];
};

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<ImportPayload>;

  if (
    !body.fileName ||
    typeof body.totalRows !== "number" ||
    !Array.isArray(body.validOrders) ||
    !Array.isArray(body.rejectedRows)
  ) {
    return NextResponse.json({ error: "Payload de importacao invalido." }, { status: 400 });
  }

  const { job, importedCustomerIds } = await persistImport({
    tenantId: session.tenantId,
    fileName: body.fileName,
    totalRows: body.totalRows,
    validOrders: body.validOrders,
    rejectedRows: body.rejectedRows
  });

  const snapshot = await readReactiveSnapshot(session.tenantId);
  const impactedCustomers = snapshot.customers
    .filter((customer) => importedCustomerIds.includes(customer.customerId))
    .slice(0, 5)
    .map((customer) => ({
      customerId: customer.customerId,
      name: customer.name,
      seller: customer.seller,
      status: customer.status,
      priorityScore: customer.priorityScore,
      recoveredRevenue: customer.recoveredRevenue
    }));

  return NextResponse.json({
    job,
    impact: {
      duplicateOrders: body.validOrders.length - job.importedOrders,
      impactedCustomers
    }
  });
}
