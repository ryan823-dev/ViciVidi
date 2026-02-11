"use client";

import { Package, Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="产品管理">
        <Button asChild>
          <Link href="/zh-CN/products/new">
            <Plus className="mr-2 h-4 w-4" />
            新建产品
          </Link>
        </Button>
      </PageHeader>
      <EmptyState
        icon={Package}
        title="还没有产品"
        description="添加您的第一个产品开始出海之旅"
        actionLabel="新建产品"
        actionHref="/zh-CN/products/new"
      />
    </div>
  );
}
