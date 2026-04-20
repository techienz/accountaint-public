import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listTemplates, TEMPLATE_DEFAULTS } from "@/lib/email-templates";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const business = session.activeBusiness;
  if (!business) {
    return NextResponse.json({ error: "No active business" }, { status: 400 });
  }

  const templates = listTemplates(business.id).map((t) => {
    const d = TEMPLATE_DEFAULTS[t.kind];
    return {
      ...t,
      label: d.label,
      description: d.description,
      placeholders: d.placeholders,
      sample_data: d.sampleData,
      default_subject: d.subject,
      default_body: d.body,
    };
  });

  return NextResponse.json({ templates });
}
