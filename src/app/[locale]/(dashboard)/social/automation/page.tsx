"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SocialAutomationPage() {
  const [autoLike, setAutoLike] = useState(false);
  const [autoFollow, setAutoFollow] = useState(false);
  const [autoComment, setAutoComment] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleSave() {
    setSaving(true);
    // Simulate save in demo mode
    setTimeout(() => {
      toast.success("自动化设置已保存");
      setSaving(false);
    }, 500);
  }

  return (
    <div className="container mx-auto p-6">
      <PageHeader title="自动化设置" />
      <Card>
        <CardHeader>
          <CardTitle>自动化功能</CardTitle>
          <CardDescription>
            配置社媒自动化操作，提升海外社交媒体运营效率
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-like">自动点赞</Label>
              <p className="text-sm text-muted-foreground">
                自动点赞与您内容相关的帖子
              </p>
            </div>
            <Switch
              id="auto-like"
              checked={autoLike}
              onCheckedChange={setAutoLike}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-follow">自动关注</Label>
              <p className="text-sm text-muted-foreground">
                自动关注与您行业相关的账号
              </p>
            </div>
            <Switch
              id="auto-follow"
              checked={autoFollow}
              onCheckedChange={setAutoFollow}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-comment">AI 自动评论</Label>
              <p className="text-sm text-muted-foreground">
                AI 自动生成并发布相关评论，提升互动率
              </p>
            </div>
            <Switch
              id="auto-comment"
              checked={autoComment}
              onCheckedChange={setAutoComment}
            />
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "保存中..." : "保存设置"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
