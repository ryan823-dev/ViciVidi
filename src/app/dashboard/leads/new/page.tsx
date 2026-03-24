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

export default function NewLeadPage() {
  return (
    <div className="container mx-auto p-6">
      <PageHeader title="新建线索" />
      <Card>
        <CardHeader>
          <CardTitle>线索信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">公司名称</Label>
              <Input id="company" placeholder="输入公司名称" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">联系人姓名</Label>
              <Input id="contact" placeholder="输入联系人姓名" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" type="email" placeholder="输入邮箱地址" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">电话</Label>
              <Input id="phone" type="tel" placeholder="输入电话号码" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">网站</Label>
              <Input id="website" type="url" placeholder="https://example.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">国家</Label>
              <Input id="country" placeholder="输入国家" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">城市</Label>
              <Input id="city" placeholder="输入城市" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">行业</Label>
              <Input id="industry" placeholder="输入行业" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-size">公司规模</Label>
              <Select>
                <SelectTrigger id="company-size">
                  <SelectValue placeholder="选择公司规模" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10</SelectItem>
                  <SelectItem value="11-50">11-50</SelectItem>
                  <SelectItem value="51-200">51-200</SelectItem>
                  <SelectItem value="201-500">201-500</SelectItem>
                  <SelectItem value="500+">500+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select>
                <SelectTrigger id="status">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">新线索</SelectItem>
                  <SelectItem value="contacted">已联系</SelectItem>
                  <SelectItem value="confirmed">已确认</SelectItem>
                  <SelectItem value="converted">已转化</SelectItem>
                  <SelectItem value="lost">已流失</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">优先级</Label>
              <Select>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="选择优先级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">备注</Label>
            <Textarea
              id="notes"
              placeholder="输入备注信息"
              rows={4}
            />
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
