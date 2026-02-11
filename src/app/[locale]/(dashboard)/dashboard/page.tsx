"use client";

import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, FileText, Share2, UserSearch, Plus } from "lucide-react";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { data: session } = useSession();
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const userName = session?.user?.name || (isDemoMode ? "演示用户" : t("user"));

  const stats = [
    { label: t("stats.totalProducts"), value: 0, icon: Package },
    { label: t("stats.publishedContent"), value: 0, icon: FileText },
    { label: t("stats.scheduledPosts"), value: 0, icon: Share2 },
    { label: t("stats.activeLeads"), value: 0, icon: UserSearch },
  ];

  const modules = [
    {
      title: t("modules.products.title"),
      description: t("modules.products.description"),
      icon: Package,
      href: "/zh-CN/products",
    },
    {
      title: t("modules.seo.title"),
      description: t("modules.seo.description"),
      icon: FileText,
      href: "/zh-CN/seo",
    },
    {
      title: t("modules.social.title"),
      description: t("modules.social.description"),
      icon: Share2,
      href: "/zh-CN/social",
    },
    {
      title: t("modules.leads.title"),
      description: t("modules.leads.description"),
      icon: UserSearch,
      href: "/zh-CN/leads",
    },
  ];

  const quickActions = [
    { label: t("quickActions.newProduct"), href: "/zh-CN/products/new" },
    { label: t("quickActions.newContent"), href: "/zh-CN/seo/new" },
    { label: t("quickActions.newPost"), href: "/zh-CN/social/new" },
    { label: t("quickActions.newLead"), href: "/zh-CN/leads/new" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("welcome", { name: userName })}
        </h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Module Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t("modulesTitle")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Link key={index} href={module.href}>
                <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{module.title}</CardTitle>
                      </div>
                    </div>
                    <CardDescription className="mt-2">
                      {module.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t("quickActionsTitle")}</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action, index) => (
            <Button key={index} asChild>
              <Link href={action.href}>
                <Plus className="h-4 w-4 mr-2" />
                {action.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
