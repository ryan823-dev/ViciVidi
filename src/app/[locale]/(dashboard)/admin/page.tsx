"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users } from "lucide-react";

export default function AdminPage() {
  return (
    <div>
      <PageHeader title="平台管理" description="管理平台租户和系统设置" />
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">租户总数</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">用户总数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>租户列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">平台管理</p>
                <p className="text-sm text-muted-foreground">platform</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Enterprise</Badge>
                <Badge variant="outline" className="text-green-600 border-green-200">活跃</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">示例工业公司</p>
                <p className="text-sm text-muted-foreground">demo-company</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Pro</Badge>
                <Badge variant="outline" className="text-green-600 border-green-200">活跃</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
