import { NextRequest, NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth";
import { InboxMutation } from "@/lib/reactive-domain";
import { persistInboxMutation } from "@/lib/reactive-store";

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<InboxMutation>;

  if (!body.type || !body.customerId) {
    return NextResponse.json({ error: "Payload de inbox invalido." }, { status: 400 });
  }

  if ((body.type === "add_inbound" || body.type === "add_outbound") && !body.body?.trim()) {
    return NextResponse.json({ error: "Mensagem obrigatoria." }, { status: 400 });
  }

  const result = await persistInboxMutation({
    ...(body as Omit<InboxMutation, "tenantId"> & { tenantId: string }),
    tenantId: session.tenantId
  } as InboxMutation);
  return NextResponse.json({ updated: result.updated });
}
