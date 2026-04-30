import { getDb, schema } from "@/lib/db";
import { sql, and, isNotNull, notInArray } from "drizzle-orm";
import type { Check } from "../types";

/**
 * Tenant referential integrity: every business-scoped row must point at a real
 * business. FK constraints normally enforce this, but the check catches
 * orphans that would only appear if FK enforcement was off during a write
 * (e.g., raw migrations). Cheap to run; high signal if it ever flags.
 */
export const tenancyIntegrityCheck: Check = {
  name: "Tenant referential integrity",
  category: "Multi-tenancy",
  async run() {
    const db = getDb();
    const validBusinessIds = db
      .select({ id: schema.businesses.id })
      .from(schema.businesses)
      .all()
      .map((b) => b.id);

    if (validBusinessIds.length === 0) {
      return { status: "pass", message: "No businesses yet — nothing to validate." };
    }

    // Tuple: (label, table, business_id column, nullable?)
    const scoped: { label: string; table: any; col: any; nullable?: boolean }[] = [
      { label: "shareholders", table: schema.shareholders, col: schema.shareholders.business_id },
      { label: "employees", table: schema.employees, col: schema.employees.business_id },
      { label: "contacts", table: schema.contacts, col: schema.contacts.business_id },
      { label: "invoices", table: schema.invoices, col: schema.invoices.business_id },
      { label: "expenses", table: schema.expenses, col: schema.expenses.business_id },
      { label: "work_contracts", table: schema.workContracts, col: schema.workContracts.business_id },
      { label: "timesheet_entries", table: schema.timesheetEntries, col: schema.timesheetEntries.business_id },
      { label: "journal_entries", table: schema.journalEntries, col: schema.journalEntries.business_id },
      { label: "akahu_accounts", table: schema.akahuAccounts, col: schema.akahuAccounts.linked_business_id, nullable: true },
      { label: "documents", table: schema.documents, col: schema.documents.business_id },
      { label: "email_log", table: schema.emailLog, col: schema.emailLog.business_id },
    ];

    const offending: { id: string; description: string }[] = [];
    let totalOrphanRows = 0;

    for (const { label, table, col, nullable } of scoped) {
      const where = nullable
        ? and(isNotNull(col), notInArray(col, validBusinessIds))
        : notInArray(col, validBusinessIds);
      const result = db
        .select({ count: sql<number>`count(*)` })
        .from(table)
        .where(where)
        .all();
      const count = result[0]?.count ?? 0;
      if (count > 0) {
        offending.push({
          id: label,
          description: `${label}: ${count} row(s) reference a business_id not present in businesses`,
        });
        totalOrphanRows += count;
      }
    }

    if (offending.length === 0) {
      return {
        status: "pass",
        message: `All ${scoped.length} scoped tables reference valid businesses.`,
      };
    }
    return {
      status: "fail",
      message: `${offending.length} table(s) contain ${totalOrphanRows} orphaned row(s).`,
      count: totalOrphanRows,
      details: offending,
    };
  },
};
