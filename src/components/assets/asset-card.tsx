"use client";

import { useState } from "react";
import { MoreHorizontal, Download, Trash2, FolderInput, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AssetThumbnail } from "./asset-thumbnail";
import {
  formatFileSize,
  getFileCategoryLabel,
  getFileCategoryColor,
  truncateFileName,
} from "@/lib/utils/file-utils";
import { cn } from "@/lib/utils";
import type { AssetWithFolder, FileCategory } from "@/types/assets";

interface AssetCardProps {
  asset: AssetWithFolder;
  thumbnailUrl?: string | null;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onOpen: () => void;
  onDownload?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
}

export function AssetCard({
  asset,
  thumbnailUrl,
  isSelected,
  onSelect,
  onOpen,
  onDownload,
  onMove,
  onDelete,
}: AssetCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden cursor-pointer transition-all",
        isSelected && "ring-2 ring-primary"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onOpen}
    >
      {/* 缩略图区域 (4:3 比例) */}
      <div className="relative aspect-[4/3] bg-muted">
        <AssetThumbnail
          storageKey={asset.storageKey}
          fileCategory={asset.fileCategory as FileCategory}
          mimeType={asset.mimeType}
          title={asset.title}
          thumbnailUrl={thumbnailUrl}
          size="lg"
          className="absolute inset-0"
        />

        {/* 左上角 Checkbox */}
        <div
          className={cn(
            "absolute top-2 left-2 transition-opacity",
            isHovered || isSelected ? "opacity-100" : "opacity-0"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            className="bg-white/80 border-gray-300"
          />
        </div>

        {/* 右上角操作菜单 */}
        <div
          className={cn(
            "absolute top-2 right-2 transition-opacity",
            isHovered ? "opacity-100" : "opacity-0"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 bg-white/80 hover:bg-white"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpen}>
                <Eye className="h-4 w-4 mr-2" />
                查看详情
              </DropdownMenuItem>
              {onDownload && (
                <DropdownMenuItem onClick={onDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  下载
                </DropdownMenuItem>
              )}
              {onMove && (
                <DropdownMenuItem onClick={onMove}>
                  <FolderInput className="h-4 w-4 mr-2" />
                  移动到...
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 类型标签 */}
        <div className="absolute bottom-2 left-2">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs",
              getFileCategoryColor(asset.fileCategory as FileCategory)
            )}
          >
            {getFileCategoryLabel(asset.fileCategory as FileCategory)}
          </Badge>
        </div>
      </div>

      {/* 信息区域 */}
      <div className="p-3">
        <h3
          className="text-sm font-medium truncate"
          title={asset.title || asset.originalName}
        >
          {truncateFileName(asset.title || asset.originalName, 25)}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            {formatFileSize(asset.fileSize)}
          </span>
          {asset.folder && (
            <span className="text-xs text-muted-foreground truncate ml-2">
              {asset.folder.name}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
