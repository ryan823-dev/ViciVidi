"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/seo/score-badge";
import {
  Search,
  Loader2,
  ExternalLink,
  Trash2,
  Eye,
} from "lucide-react";
import { createAudit, getAudits, deleteAudit } from "@/actions/audit";

interface AuditListItem {
  id: string;
  targetUrl: string;
  status: string;
  progress: number;
  scores: Record<string, number> | null;
  pagesCrawled: number;
  crawlDuration: number | null;
  createdAt: string;
  completedAt: string | null;
}

const statusBadgeVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  crawling: "secondary",
  analyzing: "secondary",
  completed: "default",
  failed: "destructive",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  crawling: "Crawling...",
  analyzing: "Analyzing...",
  completed: "Completed",
  failed: "Failed",
};

export default function SEOPlannerPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [audits, setAudits] = useState<AuditListItem[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(true);

  useEffect(() => {
    loadAudits();
  }, []);

  async function loadAudits() {
    try {
      const data = await getAudits();
      setAudits(
        data.map((a) => ({
          ...a,
          scores: a.scores as Record<string, number> | null,
          createdAt: a.createdAt.toISOString(),
          completedAt: a.completedAt?.toISOString() ?? null,
        }))
      );
    } catch {
      // ignore
    } finally {
      setLoadingAudits(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http")) {
      targetUrl = `https://${targetUrl}`;
    }

    setLoading(true);
    try {
      const audit = await createAudit(targetUrl);

      // Fire-and-forget trigger
      fetch(`/api/audit/${audit.id}/execute`, { method: "POST" }).catch(
        () => {}
      );

      router.push(`/zh-CN/seo/planner/${audit.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to start audit");
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this audit?")) return;
    try {
      await deleteAudit(id);
      setAudits((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="SEO/GEO Audit" />

      {/* New Audit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Website Audit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Enter any website URL to analyze 25+ SEO and GEO (AI Engine Optimization) factors.
            Get a scored report with actionable recommendations.
          </p>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="url" className="sr-only">
                Website URL
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading || !url.trim()}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Start Audit
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Audit History */}
      <Card>
        <CardHeader>
          <CardTitle>Audit History</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAudits ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : audits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No audits yet. Enter a URL above to start your first audit.
            </div>
          ) : (
            <div className="space-y-3">
              {audits.map((audit) => (
                <div
                  key={audit.id}
                  className="flex items-center gap-4 rounded-lg border p-4"
                >
                  {/* Score */}
                  <div className="flex-shrink-0">
                    {audit.status === "completed" &&
                    audit.scores &&
                    typeof (audit.scores as Record<string, number>).overall ===
                      "number" ? (
                      <ScoreBadge
                        score={
                          (audit.scores as Record<string, number>).overall
                        }
                        size="sm"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        --
                      </div>
                    )}
                  </div>

                  {/* URL + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {audit.targetUrl}
                      </span>
                      <Badge variant={statusBadgeVariant[audit.status] ?? "outline"}>
                        {statusLabels[audit.status] ?? audit.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(audit.createdAt).toLocaleDateString()}{" "}
                      {new Date(audit.createdAt).toLocaleTimeString()}
                      {audit.crawlDuration &&
                        ` · ${(audit.crawlDuration / 1000).toFixed(1)}s`}
                      {audit.pagesCrawled > 0 &&
                        ` · ${audit.pagesCrawled} pages`}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {audit.status === "completed" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          router.push(`/zh-CN/seo/planner/${audit.id}`)
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {(audit.status === "crawling" ||
                      audit.status === "analyzing") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          router.push(`/zh-CN/seo/planner/${audit.id}`)
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(audit.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
