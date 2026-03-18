import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth";
import { readReactiveSnapshot } from "@/lib/reactive-store";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await readReactiveSnapshot(session.tenantId);
  return NextResponse.json(snapshot);
}
