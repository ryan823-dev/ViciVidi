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

export default function NewProductPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const handleCancel = () => {
    router.push(`/${locale}/products`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="新建产品" />

      <Card>
        <CardHeader>
          <CardTitle>产品信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">产品名称</Label>
              <Input id="name" placeholder="输入产品名称" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" placeholder="输入产品SKU" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">产品描述</Label>
            <Textarea
              id="description"
              placeholder="输入产品描述"
              rows={4}
            />
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
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>技术规格</Label>
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
              技术规格编辑器将在此处显示
            </div>
          </div>

          <div className="space-y-2">
            <Label>产品图片</Label>
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
              产品图片上传区域将在此处显示
            </div>
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
