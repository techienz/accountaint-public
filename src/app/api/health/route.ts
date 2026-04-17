import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Basic liveness + readiness check.
 * Returns 200 when the app can serve requests and the DB is reachable.
 */
export async function GET() {
  try {
    const db = getDb();
    // Cheap sanity query — touches the DB, confirms it's open and readable.
    db.select().from(schema.users).limit(1).all();
    return NextResponse.json({
      status: "ok",
      uptime_seconds: Math.floor(process.uptime()),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { status: "error", error: message },
      { status: 503 }
    );
  }
}
