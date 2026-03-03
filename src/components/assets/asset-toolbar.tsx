"use client";

import { Button } from "@/components/ui/button";
import {
  FolderInput,
  Tag,
  Trash2,
  X,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AssetToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onMove: () => void;
  onAddTags: () => void;
  onSetPurpose: () => void;
  onDelete: () => void;
  className?: string;
}

export function AssetToolbar({
  selectedCount,
  onClearSelection,
  onMove,
  onAddTags,
  onSetPurpose,
  onDelete,
  className,
}: AssetToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20",
        className
      )}
    >
      {/* 选中数量 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          已选择 {selectedCount} 项
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-4 w-px bg-border" />

      {/* 操作按钮 */}
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={onMove}>
          <FolderInput className="h-4 w-4 mr-1" />
          移动
        </Button>
        <Button variant="outline" size="sm" onClick={onSetPurpose}>
          <Target className="h-4 w-4 mr-1" />
          标记用途
        </Button>
        <Button variant="outline" size="sm" onClick={onAddTags}>
          <Tag className="h-4 w-4 mr-1" />
          添加标签
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="text-red-600 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          删除
        </Button>
      </div>
    </div>
  );
}
