"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  Sparkles,
  FileText,
  ShieldCheck,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  Lock,
  MessageSquarePlus,
} from "lucide-react";
import Link from "next/link";
import {
  getContentPieceById,
  createContentPiece,
  updateContentPiece,
  generateOutlineFromBrief,
  generateContentFromOutline,
  getContentCategories,
  type ContentPieceData,
  type ContentOutline,
} from "@/actions/contents";
import { getBriefById, type BriefDetail } from "@/actions/briefs";
import { getEvidences } from "@/actions/evidence";
import { getGuidelines } from "@/actions/guidelines";
import { getLatestVersion, createVersion } from "@/actions/versions";
import type { EvidenceData, GuidelineData } from "@/types/knowledge";
import type { AnchorSpec, ArtifactStatusValue } from "@/types/artifact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CollaborativeShell } from "@/components/collaboration";

export default function ContentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const contentId = params.id as string;
  const isNew = contentId === "new";
  const briefIdFromQuery = searchParams.get("briefId");

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  // Data
  const [content, setContent] = useState<ContentPieceData | null>(null);
  const [brief, setBrief] = useState<BriefDetail | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [evidences, setEvidences] = useState<EvidenceData[]>([]);
  const [guidelines, setGuidelines] = useState<GuidelineData[]>([]);

  // Form state
  const [form, setForm] = useState({
    title: "",
    slug: "",
    categoryId: "",
    content: "",
    excerpt: "",
    metaTitle: "",
    metaDescription: "",
    keywords: [] as string[],
    outline: null as ContentOutline | null,
    evidenceRefs: [] as string[],
  });

  // UI state
  const [showEvidencePicker, setShowEvidencePicker] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    outline: true,
    evidence: true,
    guidelines: false,
    seo: false,
  });

  // 协作相关状态
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState<AnchorSpec | null>(null);
  const [highlightedBlockId, setHighlightedBlockId] = useState<string | null>(null);

  // Guideline validation
  const [guidelineHints, setGuidelineHints] = useState<Array<{
    guideline: GuidelineData;
    matched: boolean;
    matches: string[];
  }>>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [categoriesData, evidencesData, guidelinesData] = await Promise.all([
        getContentCategories(),
        getEvidences({ status: "active" }, { page: 1, pageSize: 100 }),
        getGuidelines(),
      ]);
      setCategories(categoriesData);
      setEvidences(evidencesData.items);
      setGuidelines(guidelinesData);

      if (isNew && briefIdFromQuery) {
        // Load brief for new content
        const briefData = await getBriefById(briefIdFromQuery);
        if (briefData) {
          setBrief(briefData);
          setForm((prev) => ({
            ...prev,
            title: briefData.title,
            keywords: briefData.targetKeywords,
          }));
        }
      } else if (!isNew) {
        // Load existing content
        const contentData = await getContentPieceById(contentId);
        if (contentData) {
          setContent(contentData);
          setForm({
            title: contentData.title,
            slug: contentData.slug,
            categoryId: contentData.categoryId,
            content: contentData.content,
            excerpt: contentData.excerpt || "",
            metaTitle: contentData.metaTitle || "",
            metaDescription: contentData.metaDescription || "",
            keywords: contentData.keywords,
            outline: contentData.outline,
            evidenceRefs: contentData.evidenceRefs,
          });
          if (contentData.briefId) {
            const briefData = await getBriefById(contentData.briefId);
            setBrief(briefData);
          }
          
          // 加载版本信息
          try {
            const latestVersion = await getLatestVersion('ContentPiece', contentId);
            if (latestVersion) {
              setCurrentVersionId(latestVersion.id);
              const status = latestVersion.status as ArtifactStatusValue;
              setIsReadOnly(status === 'approved' || status === 'archived');
            }
          } catch {
            // 如果没有版本，创建初始版本
            const newVersion = await createVersion(
              'ContentPiece',
              contentId,
              contentData as unknown as Record<string, unknown>,
              { changeNote: '初始版本' }
            );
            setCurrentVersionId(newVersion.id);
            setIsReadOnly(false);
          }
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载数据失败");
    } finally {
      setIsLoading(false);
    }
  }, [contentId, isNew, briefIdFromQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Validate content against guidelines
  useEffect(() => {
    if (!form.content || guidelines.length === 0) {
      setGuidelineHints([]);
      return;
    }

    const hints = guidelines
      .filter((g) => g.isActive)
      .map((g) => {
        // Extract keywords from guideline content (simple implementation)
        const keywords: string[] = g.content
          .split(/[，,、\s]+/)
          .filter((w: string) => w.length >= 2 && w.length <= 10)
          .slice(0, 5);

        const matches: string[] = [];
        keywords.forEach((kw: string) => {
          if (form.content.toLowerCase().includes(kw.toLowerCase())) {
            matches.push(kw);
          }
        });

        return {
          guideline: g,
          matched: matches.length > 0,
          matches,
        };
      });

    setGuidelineHints(hints);
  }, [form.content, guidelines]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("请输入标题");
      return;
    }
    if (!form.categoryId) {
      toast.error("请选择分类");
      return;
    }

    setIsSaving(true);
    try {
      if (isNew) {
        const created = await createContentPiece({
          briefId: briefIdFromQuery || undefined,
          title: form.title,
          slug: form.slug || undefined,
          categoryId: form.categoryId,
          content: form.content,
          excerpt: form.excerpt || undefined,
          metaTitle: form.metaTitle || undefined,
          metaDescription: form.metaDescription || undefined,
          keywords: form.keywords,
          outline: form.outline || undefined,
          evidenceRefs: form.evidenceRefs,
        });
        toast.success("内容已创建");
        router.push(`/c/marketing/contents/${created.id}`);
      } else {
        await updateContentPiece(contentId, {
          title: form.title,
          slug: form.slug,
          categoryId: form.categoryId,
          content: form.content,
          excerpt: form.excerpt || undefined,
          metaTitle: form.metaTitle || undefined,
          metaDescription: form.metaDescription || undefined,
          keywords: form.keywords,
          outline: form.outline || undefined,
          evidenceRefs: form.evidenceRefs,
        });
        toast.success("已保存");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateOutline = async () => {
    const targetBriefId = brief?.id || briefIdFromQuery;
    if (!targetBriefId) {
      toast.error("请先关联内容规划");
      return;
    }

    setIsGeneratingOutline(true);
    try {
      const outline = await generateOutlineFromBrief(targetBriefId);
      setForm((prev) => ({ ...prev, outline }));
      toast.success("大纲已生成");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "生成失败");
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleGenerateContent = async () => {
    const targetBriefId = brief?.id || briefIdFromQuery;
    if (!targetBriefId || !form.outline) {
      toast.error("请先生成大纲");
      return;
    }

    setIsGeneratingContent(true);
    try {
      const result = await generateContentFromOutline(
        targetBriefId,
        form.outline,
        form.evidenceRefs
      );
      setForm((prev) => ({
        ...prev,
        content: result.content,
        evidenceRefs: result.usedEvidences,
      }));
      toast.success("内容已生成");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "生成失败");
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const toggleEvidence = (id: string) => {
    setForm((prev) => ({
      ...prev,
      evidenceRefs: prev.evidenceRefs.includes(id)
        ? prev.evidenceRefs.filter((e) => e !== id)
        : [...prev.evidenceRefs, id],
    }));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // 锚点相关函数
  const handleAnchorClick = (anchor: AnchorSpec) => {
    setHighlightedBlockId(anchor.value);
    // 3秒后清除高亮
    setTimeout(() => setHighlightedBlockId(null), 3000);
  };

  const handleStatusChange = (newStatus: ArtifactStatusValue) => {
    setIsReadOnly(newStatus === 'approved' || newStatus === 'archived');
    loadData();
  };

  const setAnchorForBlock = (blockId: string, label: string) => {
    if (isReadOnly) return;
    setActiveAnchor({
      type: 'blockId',
      value: blockId,
      label,
    });
  };

  const getBlockHighlightClass = (blockId: string) => {
    if (highlightedBlockId === blockId) {
      return 'ring-2 ring-[#C7A56A] ring-offset-2 ring-offset-[#070E15] transition-all duration-300';
    }
    return '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070E15] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C7A56A] animate-spin" />
      </div>
    );
  }

  const selectedEvidences = evidences.filter((e) => form.evidenceRefs.includes(e.id));

  return (
    <div className="min-h-screen bg-[#070E15]">
      {/* Header */}
      <div className="border-b border-[#10263B]/50 bg-[#0B1B2B]/50 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/c/marketing/contents">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-white">
                  {isNew ? "新建内容" : "编辑内容"}
                </h1>
                {brief && (
                  <p className="text-xs text-[#C7A56A] mt-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    基于: {brief.title}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isReadOnly && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#C7A56A]/10 border border-[#C7A56A]/30 rounded-lg">
                  <Lock className="w-3.5 h-3.5 text-[#C7A56A]" />
                  <span className="text-xs text-[#C7A56A]">已批准 · 只读</span>
                </div>
              )}
              <Button
                onClick={handleSave}
                disabled={isSaving || isReadOnly}
                className="bg-[#C7A56A] text-[#0B1B2B] hover:bg-[#C7A56A]/90 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                保存
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Editor */}
        <div className="flex-1 p-6 max-w-4xl">
          {/* Title & Category */}
          <div className="space-y-4 mb-6">
            <div>
              <Input
                placeholder="输入标题..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="text-xl font-bold bg-transparent border-none text-white placeholder:text-slate-600 focus-visible:ring-0 px-0"
              />
            </div>
            <div className="flex items-center gap-4">
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger className="w-40 bg-[#10263B]/50 border-[#10263B] text-white text-sm">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent className="bg-[#0B1B2B] border-[#10263B]">
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="自定义 Slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="flex-1 max-w-xs bg-[#10263B]/30 border-[#10263B] text-white text-sm"
              />
            </div>
          </div>

          {/* Outline Section */}
          <div className="bg-[#10263B]/30 border border-[#10263B]/50 rounded-xl mb-6">
            <button
              onClick={() => toggleSection("outline")}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C7A56A]" />
                <span className="font-medium text-white">内容大纲</span>
              </div>
              {expandedSections.outline ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
            {expandedSections.outline && (
              <div className="px-4 pb-4 border-t border-[#10263B]/50 pt-4">
                {form.outline ? (
                  <div className="space-y-3">
                    {form.outline.sections.map((section, idx) => {
                      const blockId = `outline-section-${idx}`;
                      return (
                        <div 
                          key={idx} 
                          className={`bg-[#070E15]/50 rounded-lg p-3 relative group ${getBlockHighlightClass(blockId)}`}
                          data-block-id={blockId}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-sm font-medium text-white flex-1">
                              {idx + 1}. {section.heading}
                            </h4>
                            {!isReadOnly && (
                              <button
                                onClick={() => setAnchorForBlock(blockId, `大纲: ${section.heading}`)}
                                className="p-1 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-[#C7A56A] transition-all"
                                title="添加评论"
                              >
                                <MessageSquarePlus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <ul className="space-y-1">
                            {section.keyPoints.map((point, pIdx) => (
                              <li key={pIdx} className="text-xs text-slate-400 flex items-start gap-2">
                                <span className="text-[#C7A56A]">•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 mb-3">尚未生成大纲</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateOutline}
                  disabled={isGeneratingOutline || !brief || isReadOnly}
                  className="mt-3 border-[#C7A56A]/30 text-[#C7A56A] hover:bg-[#C7A56A]/10"
                >
                  {isGeneratingOutline ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  {form.outline ? "重新生成大纲" : "AI 生成大纲"}
                </Button>
              </div>
            )}
          </div>

          {/* Content Editor */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Label className="text-slate-400">正文内容</Label>
                {!isReadOnly && (
                  <button
                    onClick={() => setAnchorForBlock('content-body', '正文内容')}
                    className="p-1 text-slate-500 hover:text-[#C7A56A] transition-colors"
                    title="添加评论"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateContent}
                disabled={isGeneratingContent || !form.outline || isReadOnly}
                className="border-[#C7A56A]/30 text-[#C7A56A] hover:bg-[#C7A56A]/10"
              >
                {isGeneratingContent ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                AI 生成内容
              </Button>
            </div>
            <Textarea
              placeholder="开始写作..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              disabled={isReadOnly}
              className={`min-h-[400px] bg-[#10263B]/30 border-[#10263B] text-white placeholder:text-slate-600 resize-none disabled:opacity-60 ${getBlockHighlightClass('content-body')}`}
            />
          </div>

          {/* Excerpt */}
          <div className="mb-6">
            <Label className="text-slate-400 mb-2 block">摘要</Label>
            <Textarea
              placeholder="内容摘要..."
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              className="h-24 bg-[#10263B]/30 border-[#10263B] text-white placeholder:text-slate-600 resize-none"
            />
          </div>

          {/* SEO Section */}
          <div className="bg-[#10263B]/30 border border-[#10263B]/50 rounded-xl">
            <button
              onClick={() => toggleSection("seo")}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <span className="font-medium text-white">SEO 设置</span>
              {expandedSections.seo ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
            {expandedSections.seo && (
              <div className="px-4 pb-4 border-t border-[#10263B]/50 pt-4 space-y-4">
                <div>
                  <Label className="text-slate-400 text-sm">Meta 标题</Label>
                  <Input
                    placeholder="SEO 标题"
                    value={form.metaTitle}
                    onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                    className="mt-1 bg-[#070E15]/50 border-[#10263B] text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-400 text-sm">Meta 描述</Label>
                  <Textarea
                    placeholder="SEO 描述"
                    value={form.metaDescription}
                    onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                    className="mt-1 h-20 bg-[#070E15]/50 border-[#10263B] text-white resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[340px] border-l border-[#10263B]/50 p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-65px)]">
          {/* Collaborative Shell */}
          {!isNew && content?.id && currentVersionId && (
            <CollaborativeShell
              entityType="ContentPiece"
              entityId={content.id}
              versionId={currentVersionId}
              anchorType="blockId"
              activeAnchor={activeAnchor}
              onAnchorClick={handleAnchorClick}
              onStatusChange={handleStatusChange}
              onVersionChange={(verId) => setCurrentVersionId(verId)}
              variant="dark"
              className="mb-4"
            />
          )}

          {/* Evidence References */}
          <div className="bg-[#10263B]/30 border border-[#10263B]/50 rounded-xl">
            <button
              onClick={() => toggleSection("evidence")}
              className="w-full flex items-center justify-between p-3 text-left"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-white">证据引用</span>
                <span className="text-xs text-slate-500">({form.evidenceRefs.length})</span>
              </div>
              {expandedSections.evidence ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
            {expandedSections.evidence && (
              <div className="px-3 pb-3 border-t border-[#10263B]/50 pt-3">
                {selectedEvidences.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {selectedEvidences.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-start gap-2 bg-[#070E15]/50 rounded p-2"
                      >
                        <span className="text-xs text-emerald-400 font-mono">
                          [E{selectedEvidences.indexOf(e) + 1}]
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white truncate">{e.title}</p>
                        </div>
                        <button
                          onClick={() => toggleEvidence(e.id)}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mb-3">未引用证据</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEvidencePicker(true)}
                  className="w-full border-[#10263B] text-slate-400 hover:text-white"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  添加证据
                </Button>
              </div>
            )}
          </div>

          {/* Guideline Validation */}
          <div className="bg-[#10263B]/30 border border-[#10263B]/50 rounded-xl">
            <button
              onClick={() => toggleSection("guidelines")}
              className="w-full flex items-center justify-between p-3 text-left"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">规范校验</span>
              </div>
              {expandedSections.guidelines ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
            {expandedSections.guidelines && (
              <div className="px-3 pb-3 border-t border-[#10263B]/50 pt-3">
                {guidelineHints.length > 0 ? (
                  <div className="space-y-2">
                    {guidelineHints.map((hint, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 p-2 rounded text-xs ${
                          hint.matched
                            ? "bg-emerald-500/10 border border-emerald-500/20"
                            : "bg-amber-500/10 border border-amber-500/20"
                        }`}
                      >
                        {hint.matched ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className={hint.matched ? "text-emerald-300" : "text-amber-300"}>
                            {hint.guideline.title}
                          </p>
                          {hint.matched && hint.matches.length > 0 && (
                            <p className="text-emerald-400/70 mt-0.5">
                              匹配: {hint.matches.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Info className="w-3.5 h-3.5" />
                    输入内容后自动校验规范
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Brief Context */}
          {brief && (
            <div className="bg-[#10263B]/30 border border-[#10263B]/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#C7A56A]" />
                <span className="text-sm font-medium text-white">内容规划</span>
              </div>
              <div className="space-y-2 text-xs">
                <p className="text-slate-400">
                  <span className="text-slate-500">关键词:</span>{" "}
                  {brief.targetKeywords.join(", ")}
                </p>
                <p className="text-slate-400">
                  <span className="text-slate-500">意图:</span> {brief.intent}
                </p>
                {brief.notes && (
                  <p className="text-slate-400">
                    <span className="text-slate-500">备注:</span> {brief.notes}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Evidence Picker Dialog */}
      <Dialog open={showEvidencePicker} onOpenChange={setShowEvidencePicker}>
        <DialogContent className="bg-[#0B1B2B] border-[#10263B] text-white max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">选择证据</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-2">
            {evidences.length > 0 ? (
              <div className="space-y-2">
                {evidences.map((e) => {
                  const isSelected = form.evidenceRefs.includes(e.id);
                  return (
                    <button
                      key={e.id}
                      onClick={() => toggleEvidence(e.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        isSelected
                          ? "bg-[#C7A56A]/10 border-[#C7A56A]/30"
                          : "bg-[#10263B]/30 border-[#10263B]/50 hover:border-[#C7A56A]/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-[#C7A56A] border-[#C7A56A]"
                              : "border-slate-600"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-[#0B1B2B]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{e.title}</p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{e.content}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-1.5 py-0.5 bg-[#10263B] rounded text-[10px] text-slate-400">
                              {e.type}
                            </span>
                            {e.assetName && (
                              <span className="text-[10px] text-slate-500 truncate">
                                来源: {e.assetName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">暂无可用证据</p>
            )}
          </div>
          <div className="pt-3 border-t border-[#10263B]/50">
            <Button
              onClick={() => setShowEvidencePicker(false)}
              className="w-full bg-[#C7A56A] text-[#0B1B2B] hover:bg-[#C7A56A]/90"
            >
              完成选择 ({form.evidenceRefs.length} 条)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
