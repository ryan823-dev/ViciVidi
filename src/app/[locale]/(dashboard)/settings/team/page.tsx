"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus } from "lucide-react";

const mockMembers = [
  { name: "张三", email: "admin@demo.com", role: "企业管理员", status: "active" },
  { name: "李四", email: "member@demo.com", role: "企业成员", status: "active" },
];

export default function TeamPage() {
  return (
    <div>
      <PageHeader title="团队管理" description="管理团队成员和角色权限">
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          邀请成员
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>团队成员</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockMembers.map((member) => (
              <div
                key={member.email}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{member.role}</Badge>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    活跃
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
