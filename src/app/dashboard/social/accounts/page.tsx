"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Twitter, Facebook, Linkedin, Instagram, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { getSocialAccounts, disconnectSocialAccount } from "@/actions/social";
import { toast } from "sonner";

type SocialAccount = {
  id: string;
  platform: string;
  accountName: string;
  accountId: string;
  isActive: boolean;
  expiresAt: Date | null;
  metadata: Record<string, string>;
  createdAt: Date;
};

const platformDefs = [
  { key: "x", name: "X (Twitter)", icon: Twitter, oauthUrl: "/api/oauth/twitter/authorize" },
  { key: "facebook", name: "Facebook", icon: Facebook, oauthUrl: "/api/oauth/facebook/authorize" },
  { key: "linkedin", name: "LinkedIn", icon: Linkedin, oauthUrl: null },
  { key: "instagram", name: "Instagram", icon: Instagram, oauthUrl: null },
];

export default function SocialAccountsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <SocialAccountsContent />
    </Suspense>
  );
}

function SocialAccountsContent() {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success) {
      toast.success(`${success === "facebook" ? "Facebook" : "X (Twitter)"} 账号连接成功！`);
    }
    if (error) {
      const messages: Record<string, string> = {
        demo_mode: "演示模式下无法连接真实账号",
        not_configured: "OAuth 未配置，请设置 API 密钥",
        unauthorized: "请先登录",
        no_pages: "未找到可管理的 Facebook 主页",
        callback_failed: "授权回调失败，请重试",
        invalid_state: "授权验证失败，请重试",
      };
      toast.error(messages[error] || `连接失败: ${error}`);
    }
  }, [searchParams]);

  async function loadAccounts() {
    try {
      const data = await getSocialAccounts();
      setAccounts(data as SocialAccount[]);
    } catch {
      toast.error("加载账号失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect(accountId: string) {
    setDisconnecting(accountId);
    try {
      await disconnectSocialAccount(accountId);
      toast.success("账号已断开");
      loadAccounts();
    } catch {
      toast.error("断开失败");
    } finally {
      setDisconnecting(null);
    }
  }

  function getAccountForPlatform(platformKey: string) {
    return accounts.find((a) => a.platform === platformKey && a.isActive);
  }

  function isTokenExpiringSoon(expiresAt: Date | null) {
    if (!expiresAt) return false;
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    return new Date(expiresAt).getTime() - Date.now() < threeDays;
  }

  return (
    <div className="container mx-auto p-6">
      <PageHeader title="账号管理" />
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {platformDefs.map((platform) => {
            const Icon = platform.icon;
            const account = getAccountForPlatform(platform.key);
            const connected = !!account;
            const expiringSoon = account ? isTokenExpiringSoon(account.expiresAt) : false;

            return (
              <Card key={platform.key}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Icon className="h-8 w-8" />
                    {connected ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        已连接
                      </Badge>
                    ) : (
                      <Badge variant="secondary">未连接</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{platform.name}</CardTitle>
                  {connected && (
                    <p className="text-sm text-muted-foreground">{account.accountName}</p>
                  )}
                  {expiringSoon && (
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <AlertCircle className="h-3 w-3" />
                      Token 即将过期
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {connected ? (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleDisconnect(account.id)}
                      disabled={disconnecting === account.id}
                    >
                      {disconnecting === account.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      断开连接
                    </Button>
                  ) : platform.oauthUrl ? (
                    <Button className="w-full" asChild>
                      <a href={platform.oauthUrl}>连接</a>
                    </Button>
                  ) : (
                    <Button className="w-full" disabled>
                      即将支持
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
