"use client";

import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div>
      <PageHeader title="个人资料" description="管理您的个人信息和偏好设置" />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>显示名称</Label>
            <Input defaultValue={user?.name || ""} placeholder="您的姓名" />
          </div>
          <div className="space-y-2">
            <Label>邮箱</Label>
            <Input defaultValue={user?.email || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>当前角色</Label>
            <Input defaultValue={user?.roleName || ""} disabled />
          </div>
          <div className="pt-4">
            <Button>保存修改</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
