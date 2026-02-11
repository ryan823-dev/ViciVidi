"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function TenantDetailPage() {
  return (
    <div>
      <PageHeader title="租户详情" description="查看和管理租户信息">
        <Button variant="outline">暂停</Button>
      </PageHeader>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>租户信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">名称</span>
            <span className="font-medium">示例工业公司</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">标识</span>
            <span className="font-medium">demo-company</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">套餐</span>
            <Badge variant="secondary">Pro</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">状态</span>
            <Badge variant="outline" className="text-green-600 border-green-200">活跃</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">用户数</span>
            <span className="font-medium">2</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
