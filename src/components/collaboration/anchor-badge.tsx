"use client";

import { Braces, Blocks, TextSelect, AlignLeft, type LucideIcon } from "lucide-react";
import type { AnchorType } from "@/types/artifact";

interface AnchorBadgeProps {
  type: AnchorType;
  label: string;
  onClick?: () => void;
  className?: string;
}

const ANCHOR_CONFIG: Record<AnchorType, { icon: LucideIcon; color: string; bgColor: string }> = {
  jsonPath: {
    icon: Braces,
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200 hover:bg-amber-100",
  },
  blockId: {
    icon: Blocks,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  },
  textRange: {
    icon: TextSelect,
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200 hover:bg-purple-100",
  },
  rowId: {
    icon: AlignLeft,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
  },
};

export function AnchorBadge({ type, label, onClick, className = "" }: AnchorBadgeProps) {
  const config = ANCHOR_CONFIG[type];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 
        text-xs font-medium rounded-md border
        transition-colors cursor-pointer
        ${config.bgColor} ${config.color}
        ${className}
      `}
      title={`跳转到: ${label}`}
    >
      <Icon size={12} />
      <span className="max-w-[100px] truncate">{label}</span>
    </button>
  );
}

// 暗色主题版本（用于 ContentPiece 编辑器）
export function AnchorBadgeDark({ type, label, onClick, className = "" }: AnchorBadgeProps) {
  const DARK_CONFIG: Record<AnchorType, { icon: LucideIcon; color: string; bgColor: string }> = {
    jsonPath: {
      icon: Braces,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20",
    },
    blockId: {
      icon: Blocks,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20",
    },
    textRange: {
      icon: TextSelect,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20",
    },
    rowId: {
      icon: AlignLeft,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20",
    },
  };

  const config = DARK_CONFIG[type];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 
        text-xs font-medium rounded-md border
        transition-colors cursor-pointer
        ${config.bgColor} ${config.color}
        ${className}
      `}
      title={`跳转到: ${label}`}
    >
      <Icon size={12} />
      <span className="max-w-[100px] truncate">{label}</span>
    </button>
  );
}
