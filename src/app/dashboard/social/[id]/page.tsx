"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Send, RefreshCw, Twitter, Facebook, CheckCircle, XCircle } from "lucide-react";
import { getSocialPost, updateSocialPost, publishSocialPost, retryFailedPublish } from "@/actions/social";
import { toast } from "sonner";

type PostVersion = {
  id: string;
  platform: string;
  content: string;
  platformPostId: string | null;
  publishedAt: Date | null;
  error: string | null;
  publishAttempts: number;
};

type SocialPost = {
  id: string;
  title: string | null;
  status: string;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  autoEngage: boolean;
  versions: PostVersion[];
};

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  x: Twitter,
  facebook: Facebook,
};

export default function EditSocialPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const [isPending, startTransition] = useTransition();

  const [post, setPost] = useState<SocialPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [xContent, setXContent] = useState("");
  const [fbContent, setFbContent] = useState("");
  const [autoEngage, setAutoEngage] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSocialPost(postId);
        if (data) {
          setPost(data as SocialPost);
          setTitle(data.title || "");
          setAutoEngage(data.autoEngage);
          for (const v of data.versions) {
            if (v.platform === "x") setXContent(v.content);
            if (v.platform === "facebook") setFbContent(v.content);
          }
        }
      } catch {
        toast.error("加载失败");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [postId]);

  const isPublished = post?.status === "published";
  const isFailed = post?.status === "failed";

  function handleSave() {
    const versions: { platform: string; content: string }[] = [];
    if (xContent.trim()) versions.push({ platform: "x", content: xContent });
    if (fbContent.trim()) versions.push({ platform: "facebook", content: fbContent });

    if (versions.length === 0) {
      toast.error("请至少输入一个平台的内容");
      return;
    }

    startTransition(async () => {
      try {
        await updateSocialPost(postId, { title: title || undefined, autoEngage, versions });
        toast.success("已保存");
        router.push("/zh-CN/social");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "保存失败");
      }
    });
  }

  function handlePublish() {
    startTransition(async () => {
      try {
        const result = await publishSocialPost(postId);
        if (result.success) {
          toast.success("发布成功！");
        } else {
          toast.warning("部分发布失败");
        }
        router.push("/zh-CN/social");
      } catch {
        toast.error("发布失败");
      }
    });
  }

  function handleRetry() {
    startTransition(async () => {
      try {
        const result = await retryFailedPublish(postId);
        if (result.success) {
          toast.success("重试成功！");
        } else {
          toast.error("重试仍有失败");
        }
        router.push("/zh-CN/social");
      } catch {
        toast.error("重试失败");
      }
    });
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto p-6">
        <PageHeader title="帖子未找到" />
        <p className="text-muted-foreground">该帖子不存在或已被删除。</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <PageHeader title={isPublished ? "查看发布" : "编辑发布"} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>发布设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">标题（内部引用）</Label>
                <Input
                  id="title"
                  placeholder="输入内部标题"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isPublished}
                />
              </div>

              <div className="space-y-2">
                <Label>发布内容</Label>
                <Tabs defaultValue="x" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="x">X</TabsTrigger>
                    <TabsTrigger value="facebook">Facebook</TabsTrigger>
                  </TabsList>
                  <TabsContent value="x" className="space-y-2">
                    <Textarea
                      placeholder="输入 X (Twitter) 内容..."
                      rows={6}
                      value={xContent}
                      onChange={(e) => setXContent(e.target.value)}
                      disabled={isPublished}
                    />
                    <p className={`text-sm text-right ${xContent.length > 280 ? "text-destructive" : "text-muted-foreground"}`}>
                      {xContent.length} / 280 字符
                    </p>
                  </TabsContent>
                  <TabsContent value="facebook" className="space-y-2">
                    <Textarea
                      placeholder="输入 Facebook 内容..."
                      rows={6}
                      value={fbContent}
                      onChange={(e) => setFbContent(e.target.value)}
                      disabled={isPublished}
                    />
                    <p className="text-sm text-muted-foreground text-right">
                      {fbContent.length} 字符
                    </p>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-engage">自动互动</Label>
                  <p className="text-sm text-muted-foreground">自动点赞和回复相关评论</p>
                </div>
                <Switch
                  id="auto-engage"
                  checked={autoEngage}
                  onCheckedChange={setAutoEngage}
                  disabled={isPublished}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                {!isPublished && (
                  <>
                    <Button variant="outline" onClick={handleSave} disabled={isPending}>
                      <Save className="mr-2 h-4 w-4" />
                      保存
                    </Button>
                    <Button onClick={handlePublish} disabled={isPending}>
                      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      立即发布
                    </Button>
                  </>
                )}
                {isFailed && (
                  <Button onClick={handleRetry} disabled={isPending}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    重试发布
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>发布状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {post.versions.map((v) => {
                const PIcon = platformIcons[v.platform];
                return (
                  <div key={v.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    {PIcon && <PIcon className="h-5 w-5 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {v.platform === "x" ? "X (Twitter)" : "Facebook"}
                        </span>
                        {v.platformPostId ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            已发布
                          </Badge>
                        ) : v.error ? (
                          <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" />
                            失败
                          </Badge>
                        ) : (
                          <Badge variant="secondary">待发布</Badge>
                        )}
                      </div>
                      {v.error && (
                        <p className="text-xs text-destructive mt-1">{v.error}</p>
                      )}
                      {v.publishedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(v.publishedAt).toLocaleString("zh-CN")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
