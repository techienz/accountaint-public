import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendPayslipEmails } from "@/lib/payroll/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const business = session.activeBusiness;
  if (!business) {
    return NextResponse.json({ error: "No active business" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    employee_ids?: string[];
    subject?: string;
    body?: string;
  };

  try {
    const result = await sendPayslipEmails({
      businessId: business.id,
      payRunId: id,
      employeeIds: body.employee_ids,
      subject: body.subject,
      body: body.body,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send payslips";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
