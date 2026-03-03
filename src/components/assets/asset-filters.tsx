"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssetFilters as AssetFiltersType, FileCategory } from "@/types/assets";

interface AssetFiltersProps {
  filters: AssetFiltersType;
  onChange: (filters: AssetFiltersType) => void;
  className?: string;
}

const FILE_CATEGORIES: { value: FileCategory | "all"; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "video", label: "视频" },
  { value: "image", label: "图片" },
  { value: "document", label: "文档" },
  { value: "audio", label: "音频" },
  { value: "other", label: "其他" },
];

export function AssetFilters({ filters, onChange, className }: AssetFiltersProps) {
  const handleSearchChange = (value: string) => {
    onChange({ ...filters, search: value || undefined });
  };

  const handleCategoryChange = (category: FileCategory | "all") => {
    onChange({
      ...filters,
      fileCategory: category === "all" ? undefined : category,
    });
  };

  const handleClearFilters = () => {
    onChange({});
  };

  const hasActiveFilters = filters.search || filters.fileCategory;

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center", className)}>
      {/* 搜索框 */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索文件名、标题或标签..."
          value={filters.search || ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 文件类型筛选 */}
      <div className="flex items-center gap-1 flex-wrap">
        {FILE_CATEGORIES.map((category) => (
          <Button
            key={category.value}
            variant={
              (category.value === "all" && !filters.fileCategory) ||
              filters.fileCategory === category.value
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() => handleCategoryChange(category.value)}
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* 清除筛选 */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          清除筛选
        </Button>
      )}
    </div>
  );
}
