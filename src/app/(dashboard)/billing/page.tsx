'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Zap, 
  TrendingUp, 
  ShoppingCart, 
  History, 
  BarChart3, 
  Download,
  ExternalLink
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
  const t = useTranslations('billing');
  const tPacks = useTranslations('billing.creditPacks');
  const tLedger = useTranslations('billing.creditLedger');
  const tNoSub = useTranslations('billing.noSubscription');
  
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [ledger, setLedger] = useState<CreditLedgerEntry[]>([]);

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
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-[oklch(0.65_0.28_25)] bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>
        <Button onClick={handleManageSubscription}>
          <ExternalLink className="w-4 h-4 mr-2" />
          {t('manageSubscription')}
        </Button>
      </div>

      {!summary?.hasSubscription ? (
        // No subscription
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{tNoSub('title')}</CardTitle>
            <CardDescription>
              {tNoSub('description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4">
            <Button size="lg" onClick={() => window.location.href = '/pricing'}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              {tNoSub('viewPricing')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Has subscription
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Current Plan */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('currentPlan')}</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.currentPlan?.name}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ${summary.currentPlan?.priceCents ? (summary.currentPlan.priceCents / 100).toFixed(0) : '0'}{t('perMonth')}
                </p>
                <Badge className="mt-2" variant={summary.subscription?.status === 'ACTIVE' ? 'default' : 'destructive'}>
                  {summary.subscription?.status || 'UNKNOWN'}
                </Badge>
              </CardContent>
            </Card>

            {/* Remaining Credits */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('remainingCredits')}</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.credits.totalRemaining}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('credits')}
                </p>
                <Progress 
                  value={(summary.credits.totalRemaining / summary.currentPlan!.monthlyCredits) * 100} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            {/* Period Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('periodUsage')}</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.credits.consumed}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  / {summary.credits.allocated} {t('credits')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((summary.credits.consumed / summary.credits.allocated) * 100)}% {t('used')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Buy Credit Packs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('needMoreCredits')}</CardTitle>
                  <CardDescription>
                    {t('buyCreditPacks')}
                  </CardDescription>
                </div>
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {/* Small Pack */}
                <div className="border rounded-lg p-4 space-y-2 hover:border-primary/50 transition-colors">
                  <div className="text-sm font-medium">{tPacks('small.name')}</div>
                  <div className="text-2xl font-bold">$99</div>
                  <div className="text-sm text-muted-foreground">{tPacks('small.credits')}</div>
                  <div className="text-xs text-green-600">$0.99/credit</div>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => handleBuyCredits('pack_small')}
                  >
                    {tPacks('buy')}
                  </Button>
                </div>

                {/* Medium Pack */}
                <div className="border-2 border-primary rounded-lg p-4 space-y-2 relative">
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">{tPacks('medium.popular')}</Badge>
                  <div className="text-sm font-medium">{tPacks('medium.name')}</div>
                  <div className="text-2xl font-bold">$249</div>
                  <div className="text-sm text-muted-foreground">{tPacks('medium.credits')}</div>
                  <div className="text-xs text-green-600">$0.62/credit</div>
                  <div className="text-xs text-orange-600 font-semibold">{tPacks('medium.save')}</div>
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-[oklch(0.65_0.28_25)]"
                    onClick={() => handleBuyCredits('pack_medium')}
                  >
                    {tPacks('buy')}
                  </Button>
                </div>

                {/* Large Pack */}
                <div className="border rounded-lg p-4 space-y-2 hover:border-primary/50 transition-colors">
                  <div className="text-sm font-medium">{tPacks('large.name')}</div>
                  <div className="text-2xl font-bold">$499</div>
                  <div className="text-sm text-muted-foreground">{tPacks('large.credits')}</div>
                  <div className="text-xs text-green-600">$0.33/credit</div>
                  <div className="text-xs text-orange-600 font-semibold">{tPacks('large.save')}</div>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => handleBuyCredits('pack_large')}
                  >
                    {tPacks('buy')}
                  </Button>
                </div>

                {/* Enterprise Pack */}
                <div className="border rounded-lg p-4 space-y-2 hover:border-primary/50 transition-colors">
                  <div className="text-sm font-medium">{tPacks('enterprise.name')}</div>
                  <div className="text-2xl font-bold">$999</div>
                  <div className="text-sm text-muted-foreground">{tPacks('enterprise.credits')}</div>
                  <div className="text-xs text-green-600">$0.20/credit</div>
                  <div className="text-xs text-orange-600 font-semibold">{tPacks('enterprise.save')}</div>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => handleBuyCredits('pack_enterprise')}
                  >
                    {tPacks('buy')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Ledger */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{tLedger('title')}</CardTitle>
                  <CardDescription>
                    {tLedger('description')}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  {tLedger('exportCsv')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ledger.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{tLedger('noRecords')}</p>
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
                            {new Date(entry.createdAt).toLocaleString()}
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
                          {tLedger('balance')}: {entry.balanceAfter}
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