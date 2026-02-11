"use client";

import { Loader2 } from "lucide-react";

interface AuditProgressProps {
  progress: number;
  currentStep: string;
  status: string;
}

export function AuditProgress({
  progress,
  currentStep,
  status,
}: AuditProgressProps) {
  const isActive = status === "crawling" || status === "analyzing" || status === "pending";

  return (
    <div className="flex flex-col items-center gap-6 py-12">
      {isActive && (
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      )}
      <div className="w-full max-w-md space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{currentStep || "Waiting..."}</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-center text-muted-foreground">
          {status === "crawling" && "Crawling website pages..."}
          {status === "analyzing" && "Analyzing SEO & GEO factors..."}
          {status === "pending" && "Preparing audit..."}
        </p>
      </div>
    </div>
  );
}
