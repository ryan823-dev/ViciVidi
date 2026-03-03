"use client";

import { Film, Image as ImageIcon, FileText, Music, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssetStats } from "@/types/assets";

interface AssetStatsBarProps {
  stats: AssetStats;
  className?: string;
}

export function AssetStatsBar({ stats, className }: AssetStatsBarProps) {
  const categories = [
    { key: "video", label: "视频", icon: Film, color: "text-purple-600" },
    { key: "image", label: "图片", icon: ImageIcon, color: "text-green-600" },
    { key: "document", label: "文档", icon: FileText, color: "text-blue-600" },
    { key: "audio", label: "音频", icon: Music, color: "text-orange-600" },
  ] as const;

  return (
    <div
      className={cn(
        "flex items-center gap-6 p-3 rounded-lg bg-muted/50 text-sm",
        className
      )}
    >
      {/* 总数 */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">总计</span>
        <span className="font-semibold">{stats.total}</span>
        <span className="text-muted-foreground">个文件</span>
      </div>

      <div className="h-4 w-px bg-border" />

      {/* 总大小 */}
      <div className="flex items-center gap-2">
        <HardDrive className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{stats.totalSizeFormatted}</span>
      </div>

      <div className="h-4 w-px bg-border" />

      {/* 分类统计 */}
      <div className="flex items-center gap-4">
        {categories.map(({ key, label, icon: Icon, color }) => {
          const count = stats.byCategory[key] || 0;
          if (count === 0) return null;
          return (
            <div key={key} className="flex items-center gap-1.5">
              <Icon className={cn("h-4 w-4", color)} />
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
