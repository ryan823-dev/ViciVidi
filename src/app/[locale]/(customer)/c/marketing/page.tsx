"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  FileText, 
  PenTool, 
  Search, 
  TrendingUp,
  Loader2,
  RefreshCw,
  AlertCircle,
  Sparkles,
  X,
  Eye,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  Send,
  Tag,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import {
  getContents,
  getMarketingStats,
  generateKeywords,
  generateContent,
  saveContent,
  updateContentStatus,
  deleteContent,
  type ContentData,
  type MarketingStats,
  type KeywordSuggestion,
} from '@/actions/marketing';

type ViewMode = 'list' | 'create' | 'detail';

export default function MarketingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contents, setContents] = useState<ContentData[]>([]);
  const [stats, setStats] = useState<MarketingStats>({ totalContents: 0, published: 0, draft: 0, scheduled: 0 });
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedContent, setSelectedContent] = useState<ContentData | null>(null);

  // 创建内容状态
  const [keywordTopic, setKeywordTopic] = useState('');
  const [keywords, setKeywords] = useState<KeywordSuggestion[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [contentType, setContentType] = useState<'article' | 'product' | 'case'>('article');
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    title: string;
    content: string;
    metaTitle: string;
    metaDescription: string;
  } | null>(null);

  // 加载数据
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [contentsData, statsData] = await Promise.all([
        getContents(),
        getMarketingStats(),
      ]);
      setContents(contentsData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 生成关键词
  const handleGenerateKeywords = async () => {
    if (!keywordTopic.trim()) return;
    
    setIsGeneratingKeywords(true);
    setError(null);
    try {
      const result = await generateKeywords(keywordTopic);
      setKeywords(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '关键词生成失败');
    } finally {
      setIsGeneratingKeywords(false);
    }
  };

  // 生成内容
  const handleGenerateContent = async () => {
    if (!selectedKeyword) return;
    
    setIsGeneratingContent(true);
    setError(null);
    try {
      const result = await generateContent(selectedKeyword, contentType);
      setGeneratedContent(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '内容生成失败');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // 保存内容
  const handleSaveContent = async (status: 'draft' | 'published') => {
    if (!generatedContent) return;
    
    try {
      const saved = await saveContent({
        title: generatedContent.title,
        content: generatedContent.content,
        metaTitle: generatedContent.metaTitle,
        metaDescription: generatedContent.metaDescription,
        keywords: selectedKeyword ? [selectedKeyword] : [],
        status,
      });
      setContents(prev => [saved, ...prev]);
      setStats(prev => ({
        ...prev,
        totalContents: prev.totalContents + 1,
        [status === 'published' ? 'published' : 'draft']: prev[status === 'published' ? 'published' : 'draft'] + 1,
      }));
      // 重置创建表单
      setViewMode('list');
      setKeywordTopic('');
      setKeywords([]);
      setSelectedKeyword(null);
      setGeneratedContent(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    }
  };

  // 更新状态
  const handleStatusChange = async (contentId: string, newStatus: string) => {
    try {
      const updated = await updateContentStatus(contentId, newStatus);
      if (updated) {
        setContents(prev => prev.map(c => c.id === contentId ? updated : c));
        if (selectedContent?.id === contentId) {
          setSelectedContent(updated);
        }
      }
    } catch (err) {
      setError('更新状态失败');
    }
  };

  // 删除内容
  const handleDelete = async (contentId: string) => {
    if (!confirm('确定删除此内容？')) return;
    try {
      await deleteContent(contentId);
      setContents(prev => prev.filter(c => c.id !== contentId));
      setStats(prev => ({ ...prev, totalContents: prev.totalContents - 1 }));
      if (selectedContent?.id === contentId) {
        setSelectedContent(null);
      }
    } catch (err) {
      setError('删除失败');
    }
  };

  // 获取状态标签
  const getStatusInfo = (status: string) => {
    const map: Record<string, { label: string; color: string; icon: typeof Clock }> = {
      draft: { label: '草稿', color: 'bg-slate-100 text-slate-600', icon: Edit2 },
      published: { label: '已发布', color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle2 },
      scheduled: { label: '已排期', color: 'bg-blue-50 text-blue-600', icon: Clock },
    };
    return map[status] || { label: status, color: 'bg-slate-100 text-slate-600', icon: FileText };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#C7A56A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1B2B]">营销系统</h1>
          <p className="text-sm text-slate-500 mt-1">SEO内容生产与分发</p>
        </div>
        <div className="flex items-center gap-3">
          {viewMode === 'list' ? (
            <button 
              onClick={() => setViewMode('create')}
              className="px-4 py-2 bg-[#0B1B2B] text-[#C7A56A] rounded-xl text-sm font-medium hover:bg-[#10263B] transition-colors flex items-center gap-2"
            >
              <PenTool size={16} />
              创建内容
            </button>
          ) : (
            <button 
              onClick={() => {
                setViewMode('list');
                setKeywords([]);
                setSelectedKeyword(null);
                setGeneratedContent(null);
              }}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              返回列表
            </button>
          )}
          <button 
            onClick={loadData}
            className="p-2 text-slate-400 hover:text-[#C7A56A] transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500 shrink-0" size={20} />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '内容资产', value: stats.totalContents, icon: FileText, color: 'text-[#C7A56A]' },
          { label: '已发布', value: stats.published, icon: CheckCircle2, color: 'text-emerald-500' },
          { label: '草稿', value: stats.draft, icon: Edit2, color: 'text-slate-500' },
          { label: '已排期', value: stats.scheduled, icon: Clock, color: 'text-blue-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#FFFCF6] rounded-xl border border-[#E7E0D3] p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={16} className={stat.color} />
              <span className="text-xs text-slate-500">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-[#0B1B2B]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Content Area */}
      {viewMode === 'create' ? (
        <div className="grid grid-cols-2 gap-6">
          {/* Step 1: Keyword Research */}
          <div className="bg-[#FFFCF6] rounded-2xl border border-[#E7E0D3] p-6">
            <h3 className="font-bold text-[#0B1B2B] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-[#0B1B2B] text-[#C7A56A] rounded-full text-xs flex items-center justify-center">1</span>
              关键词规划
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">输入主题或产品名称</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keywordTopic}
                    onChange={(e) => setKeywordTopic(e.target.value)}
                    placeholder="例如：工业机器人、激光切割机..."
                    className="flex-1 px-4 py-2.5 border border-[#E7E0D3] rounded-xl text-sm focus:outline-none focus:border-[#C7A56A]"
                  />
                  <button
                    onClick={handleGenerateKeywords}
                    disabled={!keywordTopic.trim() || isGeneratingKeywords}
                    className="px-4 py-2.5 bg-[#0B1B2B] text-[#C7A56A] rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {isGeneratingKeywords ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Search size={14} />
                    )}
                    分析
                  </button>
                </div>
              </div>

              {/* Keywords List */}
              {keywords.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">选择目标关键词：</p>
                  {keywords.map((kw, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedKeyword(kw.keyword)}
                      className={`p-3 border rounded-xl cursor-pointer transition-all ${
                        selectedKeyword === kw.keyword
                          ? 'border-[#C7A56A] bg-[#C7A56A]/5'
                          : 'border-[#E7E0D3] hover:border-[#C7A56A]/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#0B1B2B] text-sm">{kw.keyword}</span>
                        {selectedKeyword === kw.keyword && (
                          <CheckCircle2 size={16} className="text-[#C7A56A]" />
                        )}
                      </div>
                      <div className="flex gap-3 mt-2 text-[10px]">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                          搜索量：{kw.searchVolume}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded">
                          难度：{kw.difficulty}
                        </span>
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded">
                          意图：{kw.intent}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Content Type */}
              {selectedKeyword && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">选择内容类型：</p>
                  <div className="flex gap-2">
                    {[
                      { value: 'article', label: 'SEO文章' },
                      { value: 'product', label: '产品页' },
                      { value: 'case', label: '案例页' },
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setContentType(type.value as 'article' | 'product' | 'case')}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          contentType === type.value
                            ? 'bg-[#0B1B2B] text-[#C7A56A]'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate Button */}
              {selectedKeyword && (
                <button
                  onClick={handleGenerateContent}
                  disabled={isGeneratingContent}
                  className="w-full py-3 bg-gradient-to-r from-[#0B1B2B] to-[#152942] text-[#C7A56A] rounded-xl font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingContent ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      AI生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      AI生成内容
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Step 2: Content Preview */}
          <div className="bg-[#FFFCF6] rounded-2xl border border-[#E7E0D3] p-6">
            <h3 className="font-bold text-[#0B1B2B] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-[#0B1B2B] text-[#C7A56A] rounded-full text-xs flex items-center justify-center">2</span>
              内容预览与发布
            </h3>

            {generatedContent ? (
              <div className="space-y-4">
                {/* SEO Meta */}
                <div className="p-3 bg-[#F7F3EA] rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">SEO标题</p>
                  <p className="text-sm font-medium text-[#0B1B2B]">{generatedContent.metaTitle}</p>
                  <p className="text-xs text-slate-500 mt-2 mb-1">SEO描述</p>
                  <p className="text-xs text-slate-600">{generatedContent.metaDescription}</p>
                </div>

                {/* Content Preview */}
                <div>
                  <h4 className="text-lg font-bold text-[#0B1B2B] mb-2">{generatedContent.title}</h4>
                  <div className="max-h-[300px] overflow-y-auto prose prose-sm prose-slate">
                    <div className="text-sm text-slate-600 whitespace-pre-wrap">
                      {generatedContent.content.slice(0, 800)}
                      {generatedContent.content.length > 800 && '...'}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-[#E7E0D3]">
                  <button
                    onClick={() => handleSaveContent('draft')}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 flex items-center justify-center gap-2"
                  >
                    <Edit2 size={14} />
                    保存草稿
                  </button>
                  <button
                    onClick={() => handleSaveContent('published')}
                    className="flex-1 py-2.5 bg-[#0B1B2B] text-[#C7A56A] rounded-xl text-sm font-medium hover:bg-[#10263B] flex items-center justify-center gap-2"
                  >
                    <Send size={14} />
                    立即发布
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <PenTool size={40} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">选择关键词后点击&quot;AI生成内容&quot;</p>
                <p className="text-xs text-slate-400 mt-1">AI将根据企业画像生成优质SEO内容</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {/* Content List */}
          <div className="col-span-2 bg-[#FFFCF6] rounded-2xl border border-[#E7E0D3] p-6">
            <h3 className="font-bold text-[#0B1B2B] mb-4">内容资产库</h3>
            
            {contents.length === 0 ? (
              <div className="text-center py-16">
                <FileText size={48} className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">暂无内容资产</p>
                <button
                  onClick={() => setViewMode('create')}
                  className="mt-4 px-4 py-2 bg-[#0B1B2B] text-[#C7A56A] rounded-xl text-sm font-medium"
                >
                  创建第一篇内容
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {contents.map((content) => {
                  const statusInfo = getStatusInfo(content.status);
                  return (
                    <div
                      key={content.id}
                      onClick={() => setSelectedContent(content)}
                      className={`p-4 border rounded-xl cursor-pointer transition-all ${
                        selectedContent?.id === content.id
                          ? 'border-[#C7A56A] bg-[#C7A56A]/5'
                          : 'border-[#E7E0D3] hover:border-[#C7A56A]/50 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-[#0B1B2B] truncate">{content.title}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          {content.metaDescription && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {content.metaDescription}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                            {content.categoryName && (
                              <span className="flex items-center gap-1">
                                <Tag size={10} />
                                {content.categoryName}
                              </span>
                            )}
                            <span>
                              {new Date(content.createdAt).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 shrink-0 ml-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Content Detail */}
          <div className="col-span-1 space-y-4">
            {selectedContent ? (
              <>
                <div className="bg-[#FFFCF6] rounded-2xl border border-[#E7E0D3] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[#0B1B2B]">内容详情</h3>
                    <button
                      onClick={() => handleDelete(selectedContent.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h4 className="font-medium text-[#0B1B2B] mb-2">{selectedContent.title}</h4>
                  
                  {selectedContent.metaTitle && (
                    <div className="mb-3 p-2 bg-[#F7F3EA] rounded-lg">
                      <p className="text-[10px] text-slate-500">SEO标题</p>
                      <p className="text-xs text-[#0B1B2B]">{selectedContent.metaTitle}</p>
                    </div>
                  )}

                  {selectedContent.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {selectedContent.keywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-slate-600 max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                    {selectedContent.content.slice(0, 500)}
                    {selectedContent.content.length > 500 && '...'}
                  </div>

                  {/* Status Actions */}
                  <div className="mt-4 pt-4 border-t border-[#E7E0D3]">
                    <p className="text-xs text-slate-500 mb-2">更新状态</p>
                    <div className="flex flex-wrap gap-2">
                      {['draft', 'published'].map((status) => {
                        const info = getStatusInfo(status);
                        return (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(selectedContent.id, status)}
                            className={`px-3 py-1.5 text-xs rounded transition-all ${
                              selectedContent.status === status
                                ? `${info.color} ring-1 ring-current`
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {info.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-[#FFFCF6] rounded-2xl border border-[#E7E0D3] p-8 text-center">
                <Eye size={40} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">选择内容查看详情</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
