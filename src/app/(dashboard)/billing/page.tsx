'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Zap, 
  TrendingUp, 
  ShoppingCart, 
  History, 
  BarChart3, 
  Download,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

interface BillingSummary {
  hasSubscription: boolean;
  currentPlan?: {
    name: string;
    monthlyCredits: number;
    priceCents: number;
  };
  credits: {
    totalRemaining: number;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    allocated: number;
    consumed: number;
  };
  subscription?: {
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  };
}

interface CreditLedgerEntry {
  id: string;
  amount: number;
  balanceAfter: number;
  type: string;
  description: string;
  createdAt: string;
}

export default function BillingDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [ledger, setLedger] = useState<CreditLedgerEntry[]>([]);
  const [showBuyDialog, setShowBuyDialog] = useState(false);

  useEffect(() => {
    loadBillingData();
  }, []);

  async function loadBillingData() {
    try {
      const [summaryRes, ledgerRes] = await Promise.all([
        fetch('/api/billing/summary'),
        fetch('/api/billing/ledger?limit=20'),
      ]);

      const summaryData = await summaryRes.json();
      const ledgerData = await ledgerRes.json();

      setSummary(summaryData);
      setLedger(ledgerData.entries || []);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuyCredits(packId: string) {
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: packId }),
      });

      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    }
  }

  async function handleManageSubscription() {
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      const { portalUrl } = await response.json();
      window.location.href = portalUrl;
    } catch (error) {
      console.error('Failed to create portal session:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">加载计费信息...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-[oklch(0.65_0.28_25)] bg-clip-text text-transparent">
            订阅与计费
          </h1>
          <p className="text-muted-foreground mt-1">
            管理您的订阅、积分和使用情况
          </p>
        </div>
        <Button onClick={handleManageSubscription}>
          <ExternalLink className="w-4 h-4 mr-2" />
          管理订阅
        </Button>
      </div>

      {!summary?.hasSubscription ? (
        // 无订阅状态
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">开始您的订阅之旅</CardTitle>
            <CardDescription>
              选择合适的套餐，解锁强大的海外客户开发能力
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4">
            <Button size="lg" onClick={() => window.location.href = '/pricing'}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              查看套餐价格
            </Button>
          </CardContent>
        </Card>
      ) : (
        // 有订阅状态
        <>
          {/* 关键指标卡片 */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* 当前套餐 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">当前套餐</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.currentPlan?.name}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ${summary.currentPlan?.priceCents ? (summary.currentPlan.priceCents / 100).toFixed(0) : '0'}/月
                </p>
                <Badge className="mt-2" variant={summary.subscription?.status === 'ACTIVE' ? 'default' : 'destructive'}>
                  {summary.subscription?.status || 'UNKNOWN'}
                </Badge>
              </CardContent>
            </Card>

            {/* 剩余积分 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">剩余积分</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.credits.totalRemaining}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  credits
                </p>
                <Progress 
                  value={(summary.credits.totalRemaining / summary.currentPlan!.monthlyCredits) * 100} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            {/* 本期使用 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">本期使用</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.credits.consumed}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  / {summary.credits.allocated} credits
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((summary.credits.consumed / summary.credits.allocated) * 100)}% 已使用
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 购买积分包 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>需要更多积分？</CardTitle>
                  <CardDescription>
                    购买积分包，享受更低单价
                  </CardDescription>
                </div>
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {/* Small Pack */}
                <div className="border rounded-lg p-4 space-y-2 hover:border-primary/50 transition-colors">
                  <div className="text-sm font-medium">Small</div>
                  <div className="text-2xl font-bold">$99</div>
                  <div className="text-sm text-muted-foreground">100 credits</div>
                  <div className="text-xs text-green-600">$0.99/credit</div>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => handleBuyCredits('pack_small')}
                  >
                    购买
                  </Button>
                </div>

                {/* Medium Pack */}
                <div className="border-2 border-primary rounded-lg p-4 space-y-2 relative">
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">最受欢迎</Badge>
                  <div className="text-sm font-medium">Medium</div>
                  <div className="text-2xl font-bold">$249</div>
                  <div className="text-sm text-muted-foreground">400 credits</div>
                  <div className="text-xs text-green-600">$0.62/credit</div>
                  <div className="text-xs text-orange-600 font-semibold">省 38%</div>
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-[oklch(0.65_0.28_25)]"
                    onClick={() => handleBuyCredits('pack_medium')}
                  >
                    购买
                  </Button>
                </div>

                {/* Large Pack */}
                <div className="border rounded-lg p-4 space-y-2 hover:border-primary/50 transition-colors">
                  <div className="text-sm font-medium">Large</div>
                  <div className="text-2xl font-bold">$499</div>
                  <div className="text-sm text-muted-foreground">1,500 credits</div>
                  <div className="text-xs text-green-600">$0.33/credit</div>
                  <div className="text-xs text-orange-600 font-semibold">省 67%</div>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => handleBuyCredits('pack_large')}
                  >
                    购买
                  </Button>
                </div>

                {/* Enterprise Pack */}
                <div className="border rounded-lg p-4 space-y-2 hover:border-primary/50 transition-colors">
                  <div className="text-sm font-medium">Enterprise</div>
                  <div className="text-2xl font-bold">$999</div>
                  <div className="text-sm text-muted-foreground">5,000 credits</div>
                  <div className="text-xs text-green-600">$0.20/credit</div>
                  <div className="text-xs text-orange-600 font-semibold">省 80%</div>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => handleBuyCredits('pack_enterprise')}
                  >
                    购买
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 积分账本 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>积分账本</CardTitle>
                  <CardDescription>
                    查看所有积分变动的详细记录
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  导出 CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ledger.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>暂无积分变动记录</p>
                  </div>
                ) : (
                  ledger.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          entry.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {entry.amount > 0 ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <Zap className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{entry.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleString('zh-CN')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          entry.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {entry.amount > 0 ? '+' : ''}{entry.amount}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          余额：{entry.balanceAfter}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
