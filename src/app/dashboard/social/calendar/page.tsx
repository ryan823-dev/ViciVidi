"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SocialCalendarPage() {
  return (
    <div className="container mx-auto p-6">
      <PageHeader title="发布日历" />
      <Card>
        <CardHeader>
          <CardTitle>社媒发布日历视图</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            日历组件将在此处显示
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
