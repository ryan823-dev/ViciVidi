"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function CampaignDetailPage() {
  return (
    <div className="container mx-auto p-6">
      <PageHeader title="触达计划详情" />
      <Card>
        <CardHeader>
          <CardTitle>计划详情</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">计划名称</Label>
            <Input id="campaign-name" placeholder="输入计划名称" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              placeholder="输入计划描述"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-subject">邮件主题</Label>
            <Input id="email-subject" placeholder="输入邮件主题" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-template">邮件模板</Label>
            <Textarea
              id="email-template"
              placeholder="输入邮件内容模板"
              rows={10}
            />
          </div>

          <div className="space-y-2">
            <Label>计划时间范围</Label>
            <div className="flex gap-4">
              <Input type="date" placeholder="开始日期" />
              <Input type="date" placeholder="结束日期" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">状态</Label>
            <Select>
              <SelectTrigger id="status">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="active">进行中</SelectItem>
                <SelectItem value="paused">已暂停</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <Button variant="outline">取消</Button>
            <Button>保存</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
