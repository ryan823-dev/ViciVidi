"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FindingItemProps {
  factor: string;
  status: "pass" | "warn" | "fail";
  score: number;
  message: string;
  recommendation: string;
}

const statusConfig = {
  pass: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  warn: {
    icon: AlertTriangle,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  fail: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
};

export function FindingItem({
  factor,
  status,
  score,
  message,
  recommendation,
}: FindingItemProps) {
  const [open, setOpen] = useState(false);
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn("rounded-lg border", config.bg)}>
      <button
        className="flex w-full items-center gap-3 p-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <Icon className={cn("h-5 w-5 flex-shrink-0", config.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm">{factor}</span>
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                score >= 80 && "bg-green-200 text-green-800",
                score >= 50 && score < 80 && "bg-yellow-200 text-yellow-800",
                score < 50 && "bg-red-200 text-red-800"
              )}
            >
              {score}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {message}
          </p>
        </div>
        {recommendation && (
          <ChevronDown
            className={cn(
              "h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        )}
      </button>
      {open && recommendation && (
        <div className="border-t px-3 py-2 text-xs text-muted-foreground whitespace-pre-wrap">
          {recommendation}
        </div>
      )}
    </div>
  );
}
