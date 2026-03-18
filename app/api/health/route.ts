import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "reactive-saas",
    storage: process.env.DATABASE_URL ? "postgres" : "sqlite",
    timestamp: new Date().toISOString()
  });
}
