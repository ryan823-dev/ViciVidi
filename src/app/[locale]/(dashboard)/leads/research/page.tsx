"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";

export default function LeadResearchPage() {
  return (
    <div className="container mx-auto p-6">
      <PageHeader title="AI调研" />
      <Card>
        <CardHeader>
          <CardTitle>企业AI调研</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company-input">公司名称或网站URL</Label>
            <Input
              id="company-input"
              placeholder="输入公司名称或网站地址"
            />
          </div>

          <Button disabled>
            <Bot className="mr-2 h-4 w-4" />
            开始调研
          </Button>

          <div className="border rounded-lg p-8 text-center text-muted-foreground min-h-[300px] flex items-center justify-center">
            AI调研结果将在此处显示
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
