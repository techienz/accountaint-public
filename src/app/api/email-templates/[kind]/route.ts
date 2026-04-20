import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  resetTemplate,
  saveTemplate,
  TEMPLATE_DEFAULTS,
  type TemplateKind,
} from "@/lib/email-templates";

function parseKind(raw: string): TemplateKind | null {
  if (raw in TEMPLATE_DEFAULTS) return raw as TemplateKind;
  return null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ kind: string }> }
) {
  const { kind: kindRaw } = await params;
  const kind = parseKind(kindRaw);
  if (!kind) {
    return NextResponse.json({ error: "Unknown template kind" }, { status: 400 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const business = session.activeBusiness;
  if (!business) {
    return NextResponse.json({ error: "No active business" }, { status: 400 });
  }

  const body = (await request.json()) as { subject?: string; body?: string };
  if (!body.subject || body.subject.trim() === "") {
    return NextResponse.json({ error: "Subject is required" }, { status: 400 });
  }
  if (!body.body || body.body.trim() === "") {
    return NextResponse.json({ error: "Body is required" }, { status: 400 });
  }

  saveTemplate(business.id, kind, body.subject.trim(), body.body);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ kind: string }> }
) {
  const { kind: kindRaw } = await params;
  const kind = parseKind(kindRaw);
  if (!kind) {
    return NextResponse.json({ error: "Unknown template kind" }, { status: 400 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const business = session.activeBusiness;
  if (!business) {
    return NextResponse.json({ error: "No active business" }, { status: 400 });
  }

  resetTemplate(business.id, kind);
  return NextResponse.json({ success: true });
}
