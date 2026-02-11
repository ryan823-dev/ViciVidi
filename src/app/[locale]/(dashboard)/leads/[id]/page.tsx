"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LeadDetailPage() {
  return (
    <div className="container mx-auto p-6">
      <PageHeader title="线索详情" />
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="research">调研数据</TabsTrigger>
          <TabsTrigger value="activity">活动记录</TabsTrigger>
          <TabsTrigger value="campaigns">关联计划</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>公司信息</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">公司信息将在此处显示</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>联系信息</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">联系信息将在此处显示</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="research">
          <Card>
            <CardHeader>
              <CardTitle>AI调研数据</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">AI调研数据将在此处显示</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>活动时间线</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">活动记录将在此处显示</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>关联触达计划</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">关联计划将在此处显示</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
