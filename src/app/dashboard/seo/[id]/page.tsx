"use client";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function EditSEOContentPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const handleCancel = () => {
    router.push(`/${locale}/seo`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="编辑内容" />

      <Card>
        <CardHeader>
          <CardTitle>内容信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">标题</Label>
            <Input id="title" placeholder="输入内容标题" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">分类</Label>
            <Select>
              <SelectTrigger id="category">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blog">Blog (博客文章)</SelectItem>
                <SelectItem value="buy-guide">Buy Guide (采购指南)</SelectItem>
                <SelectItem value="whitepaper">Whitepaper (白皮书)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">摘要</Label>
            <Textarea
              id="excerpt"
              placeholder="输入内容摘要"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">正文</Label>
            <Textarea
              id="content"
              placeholder="富文本编辑器将在此处显示"
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">SEO设置</h3>
            
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta标题</Label>
              <Input id="metaTitle" placeholder="输入Meta标题" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta描述</Label>
              <Textarea
                id="metaDescription"
                placeholder="输入Meta描述"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">关键词</Label>
              <Input id="keywords" placeholder="输入关键词，用逗号分隔" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>特色图片</Label>
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
              图片上传区域将在此处显示
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
                <SelectItem value="published">已发布</SelectItem>
                <SelectItem value="scheduled">定时发布</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              取消
            </Button>
            <Button>
              <Save className="mr-2 h-4 w-4" />
              保存
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
