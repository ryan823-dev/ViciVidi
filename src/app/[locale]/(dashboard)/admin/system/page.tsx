"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SystemSettingsPage() {
  return (
    <div>
      <PageHeader title="系统设置" description="平台全局配置" />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>系统配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>开放注册</Label>
              <p className="text-sm text-muted-foreground">允许新用户自行注册账号</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>维护模式</Label>
              <p className="text-sm text-muted-foreground">开启后仅管理员可访问系统</p>
            </div>
            <Switch />
          </div>
          <div className="pt-4">
            <Button>保存设置</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
