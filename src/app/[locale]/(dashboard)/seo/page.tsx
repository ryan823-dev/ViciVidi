"use client";

import { FileText, Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SEOPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="SEO内容管理">
        <Button asChild>
          <Link href="/zh-CN/seo/new">
            <Plus className="mr-2 h-4 w-4" />
            新建内容
          </Link>
        </Button>
      </PageHeader>
      <EmptyState
        icon={FileText}
        title="还没有内容"
        description="创建您的第一篇SEO内容"
        actionLabel="新建内容"
        actionHref="/zh-CN/seo/new"
      />
    </div>
  );
}
