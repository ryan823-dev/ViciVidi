"use client";

import { useState } from "react";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { FolderTree as FolderTreeType, FolderWithChildren } from "@/types/assets";

interface FolderTreeProps {
  data: FolderTreeType;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (parentId?: string) => void;
  onRenameFolder: (folder: FolderWithChildren) => void;
  onDeleteFolder: (folder: FolderWithChildren) => void;
  className?: string;
}

export function FolderTree({
  data,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  className,
}: FolderTreeProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {/* 全部素材 */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
          selectedFolderId === null
            ? "bg-primary/10 text-primary"
            : "hover:bg-muted"
        )}
        onClick={() => onSelectFolder(null)}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="flex-1 text-sm font-medium">全部素材</span>
        <span className="text-xs text-muted-foreground">{data.totalAssets}</span>
      </div>

      {/* 分隔线 */}
      <div className="h-px bg-border my-2" />

      {/* 文件夹标题 */}
      <div className="flex items-center justify-between px-3 py-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          文件夹
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onCreateFolder()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* 文件夹列表 */}
      {data.folders.length === 0 ? (
        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
          暂无文件夹
        </div>
      ) : (
        <div className="space-y-0.5">
          {data.folders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              depth={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FolderItemProps {
  folder: FolderWithChildren;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (parentId?: string) => void;
  onRenameFolder: (folder: FolderWithChildren) => void;
  onDeleteFolder: (folder: FolderWithChildren) => void;
  depth: number;
}

function FolderItem({
  folder,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  depth,
}: FolderItemProps) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = selectedFolderId === folder.id;
  const assetCount = folder._count?.assets || 0;

  // 最多支持 2 层嵌套
  const canCreateSubfolder = depth < 1;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          "group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
          isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* 展开/收起按钮 */}
        {hasChildren ? (
          <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
              <ChevronRight
                className={cn(
                  "h-3 w-3 transition-transform",
                  isOpen && "rotate-90"
                )}
              />
            </Button>
          </CollapsibleTrigger>
        ) : (
          <div className="w-5" />
        )}

        {/* 文件夹图标和名称 */}
        <div
          className="flex-1 flex items-center gap-2 min-w-0"
          onClick={() => onSelectFolder(folder.id)}
        >
          {isOpen && hasChildren ? (
            <FolderOpen className="h-4 w-4 flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 flex-shrink-0" />
          )}
          <span className="text-sm truncate">{folder.name}</span>
          {assetCount > 0 && (
            <span className="text-xs text-muted-foreground">{assetCount}</span>
          )}
        </div>

        {/* 操作菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canCreateSubfolder && (
              <DropdownMenuItem onClick={() => onCreateFolder(folder.id)}>
                <Plus className="h-4 w-4 mr-2" />
                新建子文件夹
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onRenameFolder(folder)}>
              <Pencil className="h-4 w-4 mr-2" />
              重命名
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDeleteFolder(folder)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 子文件夹 */}
      {hasChildren && (
        <CollapsibleContent>
          {folder.children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child as FolderWithChildren}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              depth={depth + 1}
            />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
