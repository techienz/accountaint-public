import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { encrypt } from "@/lib/crypto";
import { getBusiness } from "@/lib/business";

const SECRET_FIELDS = ["smtp_pass", "client_secret"] as const;

function redactSecrets(configRaw: string | null): Record<string, unknown> {
  if (!configRaw) return {};
  const obj = JSON.parse(configRaw) as Record<string, unknown>;
  for (const field of SECRET_FIELDS) {
    if (obj[field]) {
      obj[`${field}_set`] = true;
      delete obj[field];
    }
  }
  return obj;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const businessId = request.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId required" }, { status: 400 });
  }

  const biz = getBusiness(session.user.id, businessId);
  if (!biz) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const db = getDb();
  const prefs = db
    .select()
    .from(schema.notificationPreferences)
    .where(eq(schema.notificationPreferences.business_id, businessId))
    .all();

  const sanitised = prefs.map((p) => ({
    ...p,
    config: redactSecrets(p.config),
  }));

  return NextResponse.json({ preferences: sanitised });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { businessId, preferences } = body;

  if (!businessId || !preferences) {
    return NextResponse.json({ error: "businessId and preferences required" }, { status: 400 });
  }

  const biz = getBusiness(session.user.id, businessId);
  if (!biz) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const db = getDb();

  // Read existing prefs first so we can preserve secrets the user didn't re-enter
  const existing = db
    .select()
    .from(schema.notificationPreferences)
    .where(eq(schema.notificationPreferences.business_id, businessId))
    .all();
  const existingByChannel = new Map(existing.map((p) => [p.channel, p]));

  // Delete existing prefs for this business (we'll re-insert)
  db.delete(schema.notificationPreferences)
    .where(eq(schema.notificationPreferences.business_id, businessId))
    .run();

  for (const [channel, pref] of Object.entries(preferences)) {
    const p = pref as { enabled: boolean; detail_level: string; config: Record<string, string> };

    const config: Record<string, string> = { ...p.config };

    // For each secret-bearing field:
    //   - If user provided a non-empty new value → encrypt and use it
    //   - If empty/missing but a previous secret existed → preserve the previous (still-encrypted) value
    //   - Otherwise → drop the field
    const previousConfig = existingByChannel.get(channel as "email" | "desktop" | "slack" | "in_app")?.config
      ? (JSON.parse(existingByChannel.get(channel as "email" | "desktop" | "slack" | "in_app")!.config!) as Record<string, string>)
      : {};

    for (const field of SECRET_FIELDS) {
      const incoming = config[field];
      if (incoming && incoming.trim() !== "") {
        config[field] = encrypt(incoming);
      } else if (previousConfig[field]) {
        config[field] = previousConfig[field];
      } else {
        delete config[field];
      }
      // Strip any incoming `*_set` flag — server-side concept only
      delete config[`${field}_set`];
    }

    db.insert(schema.notificationPreferences)
      .values({
        id: uuid(),
        business_id: businessId,
        channel: channel as "email" | "desktop" | "slack" | "in_app",
        enabled: p.enabled,
        detail_level: (p.detail_level || "vague") as "vague" | "detailed",
        config: JSON.stringify(config),
      })
      .run();
  }

  return NextResponse.json({ success: true });
}
