"use client";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { FolderOpen } from "lucide-react";

export default function ProductCategoriesPage() {
  // Initial state - no categories
  const hasCategories = false;

  return (
    <div className="space-y-6">
      <PageHeader title="产品分类" />

      {!hasCategories && (
        <EmptyState
          icon={FolderOpen}
          title="还没有分类"
          description="创建您的第一个产品分类"
        />
      )}
    </div>
  );
}
