import { getDb, schema } from "@/lib/db";
import { eq, and, sql, notInArray } from "drizzle-orm";
import type { Check } from "../types";

/**
 * Timesheet entries pointing at deleted/missing work contracts. FK should
 * prevent this but a check is cheap and catches data drift from raw migrations.
 */
export const orphanTimesheetCheck: Check = {
  name: "No orphaned timesheet entries",
  category: "Data integrity",
  async run(businessId) {
    const db = getDb();
    const validContractIds = db
      .select({ id: schema.workContracts.id })
      .from(schema.workContracts)
      .where(eq(schema.workContracts.business_id, businessId))
      .all()
      .map((c) => c.id);

    if (validContractIds.length === 0) {
      // No contracts → any entries for this business are orphans
      const result = db
        .select({ count: sql<number>`count(*)` })
        .from(schema.timesheetEntries)
        .where(eq(schema.timesheetEntries.business_id, businessId))
        .all();
      const c = result[0]?.count ?? 0;
      if (c === 0) return { status: "pass", message: "No timesheet entries yet." };
      return { status: "fail", message: `${c} timesheet entries reference no contract — but no contracts exist for this business.`, count: c };
    }

    const orphans = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.timesheetEntries)
      .where(
        and(
          eq(schema.timesheetEntries.business_id, businessId),
          notInArray(schema.timesheetEntries.work_contract_id, validContractIds)
        )
      )
      .all();
    const orphanCount = orphans[0]?.count ?? 0;

    if (orphanCount === 0) {
      return { status: "pass", message: `All timesheet entries reference valid work contracts.` };
    }
    return {
      status: "fail",
      message: `${orphanCount} timesheet entries reference a deleted work contract.`,
      count: orphanCount,
    };
  },
};

/**
 * Invoice line items pointing at deleted invoices. invoice_line_items has no
 * business_id of its own, so this is a global check across all invoices.
 */
export const orphanInvoiceLineCheck: Check = {
  name: "No orphaned invoice line items",
  category: "Data integrity",
  async run() {
    const db = getDb();
    const validInvoiceIds = db.select({ id: schema.invoices.id }).from(schema.invoices).all().map((i) => i.id);

    if (validInvoiceIds.length === 0) {
      const result = db.select({ count: sql<number>`count(*)` }).from(schema.invoiceLineItems).all();
      const c = result[0]?.count ?? 0;
      if (c === 0) return { status: "pass", message: "No invoices or line items yet." };
      return { status: "fail", message: `${c} invoice line items exist with no parent invoices at all.`, count: c };
    }

    const orphans = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.invoiceLineItems)
      .where(notInArray(schema.invoiceLineItems.invoice_id, validInvoiceIds))
      .all();
    const orphanCount = orphans[0]?.count ?? 0;

    if (orphanCount === 0) {
      return { status: "pass", message: `All invoice line items reference valid invoices.` };
    }
    return {
      status: "fail",
      message: `${orphanCount} invoice line items reference a deleted invoice.`,
      count: orphanCount,
    };
  },
};
