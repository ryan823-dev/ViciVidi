"use client";

import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  label?: string;
}

function getScoreColor(score: number) {
  if (score >= 80) return { bg: "bg-green-100", text: "text-green-700", ring: "ring-green-500" };
  if (score >= 50) return { bg: "bg-yellow-100", text: "text-yellow-700", ring: "ring-yellow-500" };
  return { bg: "bg-red-100", text: "text-red-700", ring: "ring-red-500" };
}

const sizeClasses = {
  sm: "h-10 w-10 text-sm",
  md: "h-16 w-16 text-xl",
  lg: "h-24 w-24 text-3xl",
};

export function ScoreBadge({ score, size = "md", label }: ScoreBadgeProps) {
  const colors = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-bold ring-2",
          sizeClasses[size],
          colors.bg,
          colors.text,
          colors.ring
        )}
      >
        {score}
      </div>
      {label && (
        <span className="text-xs text-muted-foreground text-center">{label}</span>
      )}
    </div>
  );
}
