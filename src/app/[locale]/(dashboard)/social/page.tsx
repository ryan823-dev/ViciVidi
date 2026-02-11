"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Share2, Plus, Twitter, Facebook, MoreHorizontal, Trash2, RefreshCw, Loader2, Edit } from "lucide-react";
import { getSocialPosts, deleteSocialPost, retryFailedPublish } from "@/actions/social";
import { toast } from "sonner";

type PostVersion = {
  id: string;
  platform: string;
  content: string;
  platformPostId: string | null;
  publishedAt: Date | null;
  error: string | null;
};

type SocialPost = {
  id: string;
  title: string | null;
  status: string;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  versions: PostVersion[];
  author: { name: string | null };
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "草稿", variant: "secondary" },
  scheduled: { label: "已排期", variant: "outline" },
  published: { label: "已发布", variant: "default" },
  failed: { label: "失败", variant: "destructive" },
};

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  x: Twitter,
  facebook: Facebook,
};

export default function SocialPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const data = await getSocialPosts();
      setPosts(data as SocialPost[]);
    } catch {
      // In demo mode with no DB, posts will be empty
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(postId: string) {
    startTransition(async () => {
      try {
        await deleteSocialPost(postId);
        toast.success("已删除");
        loadPosts();
      } catch {
        toast.error("删除失败");
      }
    });
  }

  function handleRetry(postId: string) {
    startTransition(async () => {
      try {
        const result = await retryFailedPublish(postId);
        if (result.success) {
          toast.success("重试发布成功！");
        } else {
          toast.error("重试仍有失败");
        }
        loadPosts();
      } catch {
        toast.error("重试失败");
      }
    });
  }

  const filteredPosts = filter === "all" ? posts : posts.filter((p) => p.status === filter);

  if (loading) {
    return (
      <div>
        <PageHeader title="社媒管理">
          <Button asChild>
            <Link href="/zh-CN/social/new">
              <Plus className="mr-2 h-4 w-4" />
              新建发布
            </Link>
          </Button>
        </PageHeader>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="社媒管理">
        <Button asChild>
          <Link href="/zh-CN/social/new">
            <Plus className="mr-2 h-4 w-4" />
            新建发布
          </Link>
        </Button>
      </PageHeader>

      {posts.length === 0 ? (
        <EmptyState
          icon={Share2}
          title="还没有社媒内容"
          description="创建您的第一条社媒内容，可使用 AI 自动生成"
          actionLabel="新建发布"
          actionHref="/zh-CN/social/new"
        />
      ) : (
        <>
          {/* Filters */}
          <div className="flex gap-2 mb-4">
            {[
              { key: "all", label: "全部" },
              { key: "draft", label: "草稿" },
              { key: "scheduled", label: "已排期" },
              { key: "published", label: "已发布" },
              { key: "failed", label: "失败" },
            ].map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {/* Post List */}
          <div className="space-y-3">
            {filteredPosts.map((post) => {
              const sc = statusConfig[post.status] || statusConfig.draft;
              return (
                <Card key={post.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium truncate">
                          {post.title || "无标题"}
                        </h3>
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          {post.versions.map((v) => {
                            const PIcon = platformIcons[v.platform];
                            return PIcon ? (
                              <span key={v.id} title={v.platformPostId ? "已发布" : v.error || "待发布"}>
                                <PIcon className={`h-4 w-4 ${v.platformPostId ? "text-green-600" : v.error ? "text-destructive" : "text-muted-foreground"}`} />
                              </span>
                            ) : null;
                          })}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {post.publishedAt
                            ? `发布于 ${new Date(post.publishedAt).toLocaleDateString("zh-CN")}`
                            : post.scheduledAt
                              ? `排期 ${new Date(post.scheduledAt).toLocaleDateString("zh-CN")} ${new Date(post.scheduledAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`
                              : `创建于 ${new Date(post.createdAt).toLocaleDateString("zh-CN")}`}
                        </span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isPending}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/zh-CN/social/${post.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            编辑
                          </Link>
                        </DropdownMenuItem>
                        {post.status === "failed" && (
                          <DropdownMenuItem onClick={() => handleRetry(post.id)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            重试发布
                          </DropdownMenuItem>
                        )}
                        {post.status !== "published" && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(post.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
