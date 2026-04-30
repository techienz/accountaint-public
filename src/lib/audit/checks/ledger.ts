import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generateTrialBalance } from "@/lib/ledger/reports";
import type { Check } from "../types";

export const trialBalanceCheck: Check = {
  name: "Trial balance balances",
  category: "Ledger",
  async run(businessId) {
    const tb = generateTrialBalance(businessId);
    if (tb.rows.length === 0) {
      return {
        status: "pass",
        message: "No journal activity yet — nothing to balance.",
      };
    }
    if (tb.isBalanced) {
      return {
        status: "pass",
        message: `Σ debits ${tb.totalDebit.toFixed(2)} == Σ credits ${tb.totalCredit.toFixed(2)} across ${tb.rows.length} accounts.`,
      };
    }
    const diff = Math.abs(tb.totalDebit - tb.totalCredit);
    return {
      status: "fail",
      message: `Imbalance of ${diff.toFixed(2)} (debits ${tb.totalDebit.toFixed(2)} vs credits ${tb.totalCredit.toFixed(2)}).`,
    };
  },
};

export const journalEntryBalanceCheck: Check = {
  name: "Every journal entry balances",
  category: "Ledger",
  async run(businessId) {
    const db = getDb();
    const entries = db
      .select({ id: schema.journalEntries.id, entry_number: schema.journalEntries.entry_number, description: schema.journalEntries.description })
      .from(schema.journalEntries)
      .where(eq(schema.journalEntries.business_id, businessId))
      .all();

    if (entries.length === 0) {
      return { status: "pass", message: "No journal entries yet." };
    }

    const offending: { id: string; description: string }[] = [];
    for (const entry of entries) {
      const lines = db
        .select({ debit: schema.journalLines.debit, credit: schema.journalLines.credit })
        .from(schema.journalLines)
        .where(eq(schema.journalLines.journal_entry_id, entry.id))
        .all();
      const dr = lines.reduce((s, l) => s + l.debit, 0);
      const cr = lines.reduce((s, l) => s + l.credit, 0);
      if (Math.abs(dr - cr) >= 0.01) {
        offending.push({
          id: entry.id,
          description: `#${entry.entry_number} ${entry.description} — Dr ${dr.toFixed(2)} / Cr ${cr.toFixed(2)} (diff ${(dr - cr).toFixed(2)})`,
        });
      }
    }

    if (offending.length === 0) {
      return {
        status: "pass",
        message: `All ${entries.length} journal entries balance individually.`,
      };
    }
    return {
      status: "fail",
      message: `${offending.length} of ${entries.length} entries do not balance.`,
      count: offending.length,
      details: offending.slice(0, 50),
    };
  },
};
