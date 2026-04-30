import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/encryption";
import type { Check } from "../types";

const HOURS = 1000 * 60 * 60;

/**
 * Akahu account sync freshness. Pass <24h, warn <72h, fail ≥72h.
 * Pass-through if there are no Akahu accounts linked.
 */
export const akahuSyncFreshnessCheck: Check = {
  name: "Akahu account sync freshness",
  category: "Sync",
  async run(businessId) {
    const db = getDb();
    const accounts = db
      .select({
        id: schema.akahuAccounts.id,
        name: schema.akahuAccounts.name,
        last_synced_at: schema.akahuAccounts.last_synced_at,
      })
      .from(schema.akahuAccounts)
      .where(eq(schema.akahuAccounts.linked_business_id, businessId))
      .all();

    if (accounts.length === 0) {
      return { status: "pass", message: "No Akahu accounts linked." };
    }

    const now = Date.now();
    const stale: { id: string; description: string }[] = [];
    let oldestHours = 0;

    for (const a of accounts) {
      if (!a.last_synced_at) {
        stale.push({ id: a.id, description: `${decryptSafe(a.name)} — never synced` });
        continue;
      }
      const ageHours = (now - a.last_synced_at.getTime()) / HOURS;
      if (ageHours > oldestHours) oldestHours = ageHours;
      if (ageHours >= 72) {
        stale.push({ id: a.id, description: `${decryptSafe(a.name)} — last synced ${ageHours.toFixed(1)}h ago` });
      }
    }

    if (stale.length > 0) {
      return {
        status: "fail",
        message: `${stale.length} of ${accounts.length} accounts are >72h stale (oldest ${oldestHours.toFixed(1)}h).`,
        count: stale.length,
        details: stale,
      };
    }
    if (oldestHours >= 24) {
      return {
        status: "warn",
        message: `Oldest sync is ${oldestHours.toFixed(1)}h ago (warn threshold 24h).`,
      };
    }
    return {
      status: "pass",
      message: `All ${accounts.length} account(s) synced within last 24h (oldest ${oldestHours.toFixed(1)}h).`,
    };
  },
};

function decryptSafe(value: string): string {
  try { return decrypt(value); } catch { return "(unreadable)"; }
}
