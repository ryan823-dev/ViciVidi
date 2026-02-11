"use client";

import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function CompanyPage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div>
      <PageHeader title="公司设置" description="管理公司基本信息和配置" />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>公司信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>公司名称</Label>
            <Input defaultValue={user?.tenantName || ""} placeholder="公司名称" />
          </div>
          <div className="space-y-2">
            <Label>公司标识 (Slug)</Label>
            <Input defaultValue={user?.tenantSlug || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>当前套餐</Label>
            <div>
              <Badge variant="secondary">Free</Badge>
            </div>
          </div>
          <div className="pt-4">
            <Button>保存修改</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
