import { v4 as uuid } from "uuid";
import { eq, and } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { TEMPLATE_DEFAULTS, type TemplateKind } from "./defaults";

export type { TemplateKind } from "./defaults";
export { TEMPLATE_DEFAULTS } from "./defaults";
export { renderTemplate } from "./render";

export type ResolvedTemplate = {
  kind: TemplateKind;
  subject: string;
  body: string;
  is_default: boolean;
};

/**
 * Get a template for a business + kind. Falls back to the default if the
 * user hasn't saved a customisation.
 */
export function getTemplate(
  businessId: string,
  kind: TemplateKind
): ResolvedTemplate {
  const db = getDb();
  const row = db
    .select()
    .from(schema.emailTemplates)
    .where(
      and(
        eq(schema.emailTemplates.business_id, businessId),
        eq(schema.emailTemplates.kind, kind)
      )
    )
    .get();

  if (row) {
    return { kind, subject: row.subject, body: row.body, is_default: false };
  }

  const d = TEMPLATE_DEFAULTS[kind];
  return { kind, subject: d.subject, body: d.body, is_default: true };
}

export function listTemplates(businessId: string): ResolvedTemplate[] {
  return (Object.keys(TEMPLATE_DEFAULTS) as TemplateKind[]).map((k) =>
    getTemplate(businessId, k)
  );
}

export function saveTemplate(
  businessId: string,
  kind: TemplateKind,
  subject: string,
  body: string
): void {
  const db = getDb();
  const existing = db
    .select()
    .from(schema.emailTemplates)
    .where(
      and(
        eq(schema.emailTemplates.business_id, businessId),
        eq(schema.emailTemplates.kind, kind)
      )
    )
    .get();

  if (existing) {
    db.update(schema.emailTemplates)
      .set({ subject, body, updated_at: new Date() })
      .where(eq(schema.emailTemplates.id, existing.id))
      .run();
  } else {
    db.insert(schema.emailTemplates)
      .values({
        id: uuid(),
        business_id: businessId,
        kind,
        subject,
        body,
      })
      .run();
  }
}

export function resetTemplate(businessId: string, kind: TemplateKind): void {
  const db = getDb();
  db.delete(schema.emailTemplates)
    .where(
      and(
        eq(schema.emailTemplates.business_id, businessId),
        eq(schema.emailTemplates.kind, kind)
      )
    )
    .run();
}

