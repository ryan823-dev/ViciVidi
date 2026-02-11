"use client";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserSearch, Plus } from "lucide-react";

export default function LeadsPage() {
  return (
    <div>
      <PageHeader title="AI拓客">
        <Button asChild>
          <Link href="/zh-CN/leads/new">
            <Plus className="mr-2 h-4 w-4" />
            新建线索
          </Link>
        </Button>
      </PageHeader>
      <EmptyState
        icon={UserSearch}
        title="还没有线索"
        description="添加您的第一个销售线索开始拓客"
        actionLabel="新建线索"
        actionHref="/zh-CN/leads/new"
      />
    </div>
  );
}
