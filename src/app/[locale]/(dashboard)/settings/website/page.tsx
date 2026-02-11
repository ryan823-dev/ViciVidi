"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function WebsitePage() {
  return (
    <div>
      <PageHeader title="网站配置" description="配置您的海外网站连接和发布设置" />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>网站连接</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>网站地址</Label>
            <Input placeholder="https://your-site.com" />
          </div>
          <div className="space-y-2">
            <Label>API密钥</Label>
            <Input type="password" placeholder="输入API密钥" />
          </div>
          <div className="space-y-2">
            <Label>发布接口地址</Label>
            <Input placeholder="https://your-site.com/api/publish" />
          </div>
          <div className="pt-4">
            <Button>保存配置</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
