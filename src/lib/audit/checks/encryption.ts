import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/encryption";
import type { Check } from "../types";

/**
 * Decrypt every encrypted-bearing field across the main encrypted tables.
 * If APP_ENCRYPTION_KEY changes (or a row was written with a different key),
 * decrypt() throws — we count failures.
 *
 * Scoped to the active business to keep the check fast (~ms-scale even for
 * large datasets). For a single-user/single-business install this covers
 * essentially everything.
 */
export const encryptionDecryptCheck: Check = {
  name: "All encrypted fields decrypt",
  category: "Encryption",
  async run(businessId) {
    const db = getDb();
    const failures: { id: string; description: string }[] = [];
    let totalChecked = 0;

    function tryDecrypt(label: string, rowId: string, fieldName: string, value: string | null) {
      if (value === null || value === undefined || value === "") return;
      totalChecked++;
      try {
        decrypt(value);
      } catch {
        failures.push({
          id: `${label}:${rowId}:${fieldName}`,
          description: `${label} ${rowId.slice(0, 8)} field "${fieldName}" failed to decrypt`,
        });
      }
    }

    // Shareholders
    const shs = db.select().from(schema.shareholders).where(eq(schema.shareholders.business_id, businessId)).all();
    for (const r of shs) {
      tryDecrypt("shareholder", r.id, "name", r.name);
      tryDecrypt("shareholder", r.id, "ird_number", r.ird_number);
      tryDecrypt("shareholder", r.id, "date_of_birth", r.date_of_birth);
      tryDecrypt("shareholder", r.id, "address", r.address);
    }

    // Employees
    const emps = db.select().from(schema.employees).where(eq(schema.employees.business_id, businessId)).all();
    for (const r of emps) {
      tryDecrypt("employee", r.id, "name", r.name);
      tryDecrypt("employee", r.id, "email", r.email);
      tryDecrypt("employee", r.id, "phone", r.phone);
      tryDecrypt("employee", r.id, "ird_number", r.ird_number);
      tryDecrypt("employee", r.id, "date_of_birth", r.date_of_birth);
      tryDecrypt("employee", r.id, "address", r.address);
      tryDecrypt("employee", r.id, "emergency_contact_name", r.emergency_contact_name);
      tryDecrypt("employee", r.id, "emergency_contact_phone", r.emergency_contact_phone);
    }

    // Contacts
    const cts = db.select().from(schema.contacts).where(eq(schema.contacts.business_id, businessId)).all();
    for (const r of cts) {
      tryDecrypt("contact", r.id, "name", r.name);
      tryDecrypt("contact", r.id, "email", r.email);
      tryDecrypt("contact", r.id, "phone", r.phone);
      tryDecrypt("contact", r.id, "address", r.address);
      tryDecrypt("contact", r.id, "tax_number", r.tax_number);
      tryDecrypt("contact", r.id, "cc_emails", r.cc_emails);
    }

    // Akahu accounts (encrypted name + institution)
    const akahuAccts = db.select().from(schema.akahuAccounts).where(eq(schema.akahuAccounts.linked_business_id, businessId)).all();
    for (const r of akahuAccts) {
      tryDecrypt("akahu_account", r.id, "name", r.name);
      tryDecrypt("akahu_account", r.id, "institution", r.institution);
    }

    // Expenses (vendor)
    const exps = db.select({ id: schema.expenses.id, vendor: schema.expenses.vendor }).from(schema.expenses).where(eq(schema.expenses.business_id, businessId)).all();
    for (const r of exps) {
      tryDecrypt("expense", r.id, "vendor", r.vendor);
    }

    // Work contracts (encrypted client_name)
    const wcs = db.select({ id: schema.workContracts.id, client_name: schema.workContracts.client_name }).from(schema.workContracts).where(eq(schema.workContracts.business_id, businessId)).all();
    for (const r of wcs) {
      tryDecrypt("work_contract", r.id, "client_name", r.client_name);
    }

    if (failures.length === 0) {
      return {
        status: "pass",
        message: `All ${totalChecked} encrypted fields decrypted cleanly.`,
      };
    }
    return {
      status: "fail",
      message: `${failures.length} of ${totalChecked} encrypted fields failed to decrypt — APP_ENCRYPTION_KEY may have changed.`,
      count: failures.length,
      details: failures.slice(0, 50),
    };
  },
};
