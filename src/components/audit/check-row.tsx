"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronRight } from "lucide-react";
import type { CheckResult } from "@/lib/audit/types";

const STATUS_STYLES = {
  pass: {
    icon: CheckCircle2,
    iconClass: "text-emerald-600 dark:text-emerald-400",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    label: "Pass",
  },
  warn: {
    icon: AlertTriangle,
    iconClass: "text-amber-600 dark:text-amber-400",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    label: "Warn",
  },
  fail: {
    icon: XCircle,
    iconClass: "text-red-600 dark:text-red-400",
    badgeClass: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    label: "Fail",
  },
} as const;

export function CheckRow({ result }: { result: CheckResult }) {
  const [open, setOpen] = useState(false);
  const style = STATUS_STYLES[result.status];
  const Icon = style.icon;
  const hasDetails = (result.details?.length ?? 0) > 0;

  return (
    <div className="border-b border-border/40 last:border-b-0">
      <button
        type="button"
        className={`flex w-full items-start gap-3 py-3 px-4 text-left transition-colors ${hasDetails ? "hover:bg-muted/50 cursor-pointer" : "cursor-default"}`}
        onClick={() => hasDetails && setOpen((o) => !o)}
        disabled={!hasDetails}
      >
        <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${style.iconClass}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{result.name}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.badgeClass}`}>{style.label}</span>
            <span className="text-xs text-muted-foreground ml-auto">{result.duration_ms}ms</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
        </div>
        {hasDetails && (
          <span className="shrink-0 mt-1">
            {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </span>
        )}
      </button>
      {open && hasDetails && (
        <div className="px-4 pb-3 pl-12 space-y-1">
          {result.details!.slice(0, 50).map((d) => (
            <div key={d.id} className="text-xs text-muted-foreground font-mono">
              {d.description}
            </div>
          ))}
          {result.details!.length > 50 && (
            <div className="text-xs text-muted-foreground italic">…and {result.details!.length - 50} more</div>
          )}
        </div>
      )}
    </div>
  );
}
