"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail } from "lucide-react";

type Line = {
  employee_id: string;
};

type Props = {
  payRunId: string;
  lines: Line[];
  employeesByIdName: Record<string, string>;
};

type EmpInfo = {
  id: string;
  name: string;
  email: string | null;
};

type SendResult = {
  employeeId: string;
  employeeName: string;
  recipient: string | null;
  sent: boolean;
  error?: string;
};

export function EmailPayslipsDialog({ payRunId, lines, employeesByIdName }: Props) {
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<EmpInfo[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<SendResult[] | null>(null);

  useEffect(() => {
    if (!open) return;
    // Pull full employee records so we can see who has email configured
    fetch("/api/employees")
      .then((r) => r.json())
      .then((data: Array<{ id: string; name: string; email: string | null }>) => {
        const inRun = lines.map((l) => l.employee_id);
        const filtered = data
          .filter((e) => inRun.includes(e.id))
          .map((e) => ({ id: e.id, name: e.name, email: e.email }));
        setEmployees(filtered);
        // Pre-select those with an email
        setSelected(new Set(filtered.filter((e) => e.email).map((e) => e.id)));
      })
      .catch(() => {
        // Fall back to ids + names from props, no email info
        setEmployees(
          lines.map((l) => ({
            id: l.employee_id,
            name: employeesByIdName[l.employee_id] ?? "Unknown",
            email: null,
          }))
        );
      });
  }, [open, lines, employeesByIdName]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSend() {
    if (selected.size === 0) return;
    setSending(true);
    setResults(null);

    try {
      const res = await fetch(`/api/payroll/${payRunId}/email-payslips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_ids: Array.from(selected),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResults([
          {
            employeeId: "",
            employeeName: "All",
            recipient: null,
            sent: false,
            error: data.error ?? "Send failed",
          },
        ]);
      } else {
        setResults(data.results as SendResult[]);
      }
    } catch (err) {
      setResults([
        {
          employeeId: "",
          employeeName: "All",
          recipient: null,
          sent: false,
          error: err instanceof Error ? err.message : "Send failed",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setOpen(false);
    setResults(null);
    setSelected(new Set());
  }

  const withEmail = employees.filter((e) => e.email).length;
  const withoutEmail = employees.filter((e) => !e.email).length;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : reset())}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Mail className="mr-1 h-3.5 w-3.5" />
        Email Payslips
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Email Payslips</DialogTitle>
          <DialogDescription>
            Send each employee their own payslip PDF. Uses the Payslip template
            from Settings → Email Templates.
          </DialogDescription>
        </DialogHeader>

        {results ? (
          <div className="space-y-2">
            <ul className="space-y-2 text-sm">
              {results.map((r, i) => (
                <li key={i} className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-medium">{r.employeeName}</span>
                    {r.recipient && (
                      <span className="text-muted-foreground"> — {r.recipient}</span>
                    )}
                    {r.error && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                        {r.error}
                      </p>
                    )}
                  </div>
                  <span
                    className={
                      r.sent
                        ? "text-green-600 dark:text-green-400 text-xs font-medium"
                        : "text-red-600 dark:text-red-400 text-xs font-medium"
                    }
                  >
                    {r.sent ? "Sent" : "Failed"}
                  </span>
                </li>
              ))}
            </ul>
            <Button onClick={reset}>Close</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {withEmail} of {employees.length} employee(s) have an email
              address on record.
              {withoutEmail > 0 && (
                <>
                  {" "}
                  Add missing emails on each employee&apos;s detail page.
                </>
              )}
            </p>
            <div className="rounded-md border border-border/50 max-h-[280px] overflow-auto">
              <ul className="divide-y divide-border/40">
                {employees.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 p-2">
                    <input
                      type="checkbox"
                      checked={selected.has(e.id)}
                      disabled={!e.email}
                      onChange={() => toggle(e.id)}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{e.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {e.email ?? (
                          <span className="text-amber-600 dark:text-amber-400">
                            No email set
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSend} disabled={sending || selected.size === 0}>
                {sending
                  ? "Sending..."
                  : `Send to ${selected.size} employee${selected.size === 1 ? "" : "s"}`}
              </Button>
              <Button variant="outline" onClick={reset}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
