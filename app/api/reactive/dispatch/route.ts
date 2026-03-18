import { NextRequest, NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth";
import { persistFirstDispatch } from "@/lib/reactive-store";

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { customerId?: string };

  if (!body.customerId) {
    return NextResponse.json({ error: "customerId obrigatorio." }, { status: 400 });
  }

  const result = await persistFirstDispatch(session.tenantId, body.customerId);

  return NextResponse.json({
    created: result.created,
    dispatchAt: result.dispatchAt
  });
}
