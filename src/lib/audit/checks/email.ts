import { getDb, schema } from "@/lib/db";
import { and, eq, gte } from "drizzle-orm";
import type { Check } from "../types";

const DAYS_30 = 1000 * 60 * 60 * 24 * 30;

/**
 * Email send success rate over the last 30 days for the active business.
 * Pass <5% failure, warn <20%, fail ≥20%.
 */
export const emailSuccessRateCheck: Check = {
  name: "30-day email send success rate",
  category: "Email",
  async run(businessId) {
    const db = getDb();
    const cutoff = new Date(Date.now() - DAYS_30);

    const rows = db
      .select({ success: schema.emailLog.success })
      .from(schema.emailLog)
      .where(and(eq(schema.emailLog.business_id, businessId), gte(schema.emailLog.sent_at, cutoff)))
      .all();

    if (rows.length === 0) {
      return { status: "pass", message: "No emails sent in the last 30 days." };
    }
    const total = rows.length;
    const failed = rows.filter((r) => !r.success).length;
    const failurePct = (failed / total) * 100;

    const message = `${total - failed} of ${total} sent successfully (${failurePct.toFixed(1)}% failure rate).`;
    if (failurePct >= 20) return { status: "fail", message, count: failed };
    if (failurePct >= 5) return { status: "warn", message, count: failed };
    return { status: "pass", message };
  },
};
