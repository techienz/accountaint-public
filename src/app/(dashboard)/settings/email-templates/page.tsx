import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listTemplates, TEMPLATE_DEFAULTS } from "@/lib/email-templates";
import { EmailTemplatesClient } from "./email-templates-client";

export default async function EmailTemplatesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const business = session.activeBusiness;
  if (!business) redirect("/");

  const templates = listTemplates(business.id).map((t) => {
    const d = TEMPLATE_DEFAULTS[t.kind];
    return {
      ...t,
      label: d.label,
      description: d.description,
      placeholders: d.placeholders,
      sampleData: d.sampleData,
      defaultSubject: d.subject,
      defaultBody: d.body,
    };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <EmailTemplatesClient initial={templates} />
    </div>
  );
}
