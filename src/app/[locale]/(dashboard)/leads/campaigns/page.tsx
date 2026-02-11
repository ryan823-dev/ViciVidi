"use client";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Megaphone, Plus } from "lucide-react";

export default function CampaignsPage() {
  return (
    <div>
      <PageHeader title="触达计划">
        <Button asChild>
          <Link href="/zh-CN/leads/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            新建计划
          </Link>
        </Button>
      </PageHeader>
      <EmptyState
        icon={Megaphone}
        title="还没有触达计划"
        description="创建邮件触达计划开始自动化拓客"
        actionLabel="新建计划"
        actionHref="/zh-CN/leads/campaigns/new"
      />
    </div>
  );
}
