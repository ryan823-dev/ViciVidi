"use client";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Plus, Trash2 } from "lucide-react";

export default function SEOCategoriesPage() {
  const categories = [
    {
      id: 1,
      name: "Blog",
      nameCn: "博客文章",
      count: 0,
    },
    {
      id: 2,
      name: "Buy Guide",
      nameCn: "采购指南",
      count: 0,
    },
    {
      id: 3,
      name: "Whitepaper",
      nameCn: "白皮书",
      count: 0,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="内容分类管理">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          添加分类
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>分类列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-gray-500">
                      {category.nameCn}
                    </div>
                  </div>
                  <Badge variant="secondary">{category.count} 篇内容</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
