import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendTimesheetEmail, type TimesheetFormat } from "@/lib/timesheets/email";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const business = session.activeBusiness;
  if (!business) {
    return NextResponse.json({ error: "No active business" }, { status: 400 });
  }

  const body = (await request.json()) as {
    contract_id?: string;
    date_from?: string;
    date_to?: string;
    recipient?: string;
    cc_emails?: string[];
    formats?: TimesheetFormat[];
    include_drafts?: boolean;
    subject?: string;
    body?: string;
  };

  if (!body.contract_id || !body.date_from || !body.date_to || !body.recipient) {
    return NextResponse.json(
      { error: "contract_id, date_from, date_to, recipient required" },
      { status: 400 }
    );
  }
  if (!body.formats || body.formats.length === 0) {
    return NextResponse.json(
      { error: "Select at least one attachment format" },
      { status: 400 }
    );
  }

  try {
    const result = await sendTimesheetEmail({
      businessId: business.id,
      contractId: body.contract_id,
      dateFrom: body.date_from,
      dateTo: body.date_to,
      recipient: body.recipient,
      ccEmails: body.cc_emails,
      formats: body.formats,
      includeDrafts: body.include_drafts,
      subject: body.subject,
      body: body.body,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send timesheet";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
