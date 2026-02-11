"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export function AppHeader() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  const segments = pathname
    .replace(/^\/(zh-CN|en)\//, "")
    .split("/")
    .filter(Boolean);

  const breadcrumbMap: Record<string, string> = {
    dashboard: t("dashboard"),
    products: t("products"),
    seo: t("seo"),
    social: t("social"),
    leads: t("leads"),
    settings: t("settings"),
    admin: t("admin"),
    categories: t("productCategories"),
    planner: t("seoPlanner"),
    calendar: t("socialCalendar"),
    accounts: t("socialAccounts"),
    automation: t("socialAutomation"),
    campaigns: t("leadCampaigns"),
    research: t("leadResearch"),
    profile: t("settingsProfile"),
    company: t("settingsCompany"),
    team: t("settingsTeam"),
    website: t("settingsWebsite"),
    tenants: t("adminTenants"),
    system: t("adminSystem"),
    new: "新建",
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1;
            const label = breadcrumbMap[segment] || segment;
            const href =
              "/zh-CN/" + segments.slice(0, index + 1).join("/");

            return (
              <span key={segment + index} className="contents">
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
