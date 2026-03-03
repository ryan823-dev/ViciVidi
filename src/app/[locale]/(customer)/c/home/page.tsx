"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  TrendingUp,
  Target,
  FileText,
  Clock,
  ChevronRight,
  Send,
  Lightbulb,
  Library,
  Radar,
  Globe,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import {
  getDashboardStats,
  getPendingActions,
  getTenantInfo,
  generateAIBriefing,
  type DashboardStats,
  type PendingAction,
  type TenantInfo,
  type AIBriefing,
} from '@/actions/dashboard';

// Quick action buttons for AI chat
const quickPrompts = [
  { label: '一分钟汇报', icon: Clock },
  { label: '本周战果', icon: TrendingUp },
  { label: '哪些线索值得跟进', icon: Target },
  { label: '增长瓶颈在哪', icon: Lightbulb },
];

export default function StrategicHomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [briefing, setBriefing] = useState<AIBriefing | null>(null);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);

  // Time update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsData, actionsData, tenantData] = await Promise.all([
        getDashboardStats(),
        getPendingActions(),
        getTenantInfo(),
      ]);
      setStats(statsData);
      setActions(actionsData);
      setTenantInfo(tenantData);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Generate AI briefing
  const handleGenerateBriefing = async () => {
    setIsGeneratingBriefing(true);
    try {
      const result = await generateAIBriefing();
      setBriefing(result);
    } catch (err) {
      console.error('Failed to generate briefing:', err);
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    // TODO: Implement AI chat
    console.log('Send:', inputValue);
    setInputValue('');
  };

  // Get priority style
  const getPriorityStyle = (priority: string) => {
    const styles: Record<string, string> = {
      P0: 'bg-red-100 text-red-600',
      P1: 'bg-amber-100 text-amber-600',
      P2: 'bg-blue-100 text-blue-600',
    };
    return styles[priority] || 'bg-slate-100 text-slate-600';
  };

  // Module stats for display
  const moduleStats = stats ? [
    { 
      key: 'knowledge', 
      label: '知识体系', 
      value: stats.knowledgeCompleteness.toString(), 
      unit: '%', 
      change: stats.knowledgeCompleteness >= 80 ? '完善' : stats.knowledgeCompleteness >= 50 ? '良好' : '待完善', 
      href: '/c/knowledge',
      color: stats.knowledgeCompleteness >= 80 ? 'text-emerald-500' : stats.knowledgeCompleteness >= 50 ? 'text-amber-500' : 'text-red-500',
    },
    { 
      key: 'leads', 
      label: '潜在客户', 
      value: stats.totalLeads.toString(), 
      unit: '家', 
      change: stats.highIntentLeads > 0 ? `${stats.highIntentLeads} 高意向` : '已发现', 
      href: '/c/radar',
      color: stats.highIntentLeads > 0 ? 'text-emerald-500' : 'text-slate-400',
    },
    { 
      key: 'content', 
      label: '内容资产', 
      value: stats.totalContents.toString(), 
      unit: '篇', 
      change: stats.pendingContents > 0 ? `${stats.pendingContents} 待发布` : '已就绪', 
      href: '/c/marketing',
      color: stats.pendingContents > 0 ? 'text-amber-500' : 'text-emerald-500',
    },
    { 
      key: 'actions', 
      label: '待决策项', 
      value: stats.pendingTasks.toString(), 
      unit: '项', 
      change: stats.blockedTasks > 0 ? `${stats.blockedTasks} P0阻塞` : '正常', 
      href: '/c/hub',
      color: stats.blockedTasks > 0 ? 'text-red-500' : 'text-emerald-500',
    },
  ] : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#C7A56A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Decision Briefing Header */}
      <div className="bg-[#FFFCF6] rounded-[2rem] border border-[#E7E0D3] p-8 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#0B1B2B] flex items-center gap-3">
              <Sparkles className="text-[#C7A56A]" size={24} />
              今日决策简报
            </h2>
            <p className="text-sm text-slate-500 mt-1">{currentDate}</p>
          </div>
          <div className="text-right flex items-center gap-4">
            <button
              onClick={loadData}
              className="p-2 text-slate-400 hover:text-[#C7A56A] transition-colors"
            >
              <RefreshCw size={18} />
            </button>
            <div>
              <p className="text-3xl font-bold text-[#0B1B2B]">{currentTime}</p>
              <p className="text-xs text-slate-400">更新</p>
            </div>
          </div>
        </div>

        <div className="bg-[#F7F3EA] rounded-2xl p-6 mb-6">
          <p className="text-sm text-slate-600">
            <span className="font-bold text-[#0B1B2B]">{tenantInfo?.companyName || tenantInfo?.name || '企业'}</span> 全球化获客态势
          </p>
          <p className="text-xs text-slate-500 mt-2">
            VertaX 智能引擎已完成深度分析，以下是需要您关注的关键指标与决策事项。
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          {moduleStats.map((stat) => (
            <Link
              key={stat.key}
              href={stat.href}
              className="bg-white rounded-xl p-4 border border-[#E7E0D3] hover:border-[#C7A56A]/50 hover:shadow-md transition-all group"
            >
              <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#0B1B2B]">{stat.value}</span>
                <span className="text-sm text-slate-400">{stat.unit}</span>
              </div>
              <p className={`text-[10px] mt-1 ${stat.color}`}>{stat.change}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* AI Briefing Section */}
      <div className="bg-gradient-to-br from-[#0B1B2B] to-[#10263B] rounded-[2rem] p-8 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#C7A56A]">AI 战略简报</h3>
          <button
            onClick={handleGenerateBriefing}
            disabled={isGeneratingBriefing}
            className="px-3 py-1.5 bg-[#C7A56A]/10 border border-[#C7A56A]/30 rounded-lg text-[#C7A56A] text-xs font-medium hover:bg-[#C7A56A]/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {isGeneratingBriefing ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles size={12} />
                生成简报
              </>
            )}
          </button>
        </div>

        {briefing ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-white">
              {briefing.summary}
            </p>
            
            {briefing.highlights.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-[#C7A56A]">✨ 亮点</p>
                {briefing.highlights.map((highlight, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            )}

            {briefing.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-[#C7A56A]">💡 建议</p>
                {briefing.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <Zap size={12} className="text-amber-400 mt-0.5 shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[10px] text-slate-500 pt-2">
              生成于 {new Date(briefing.generatedAt).toLocaleString('zh-CN')}
            </p>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-slate-300">
            点击"生成简报"获取 AI 战略分析
          </p>
        )}

        {/* Module Quick Links */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
          {[
            { label: '知识', icon: Library, href: '/c/knowledge' },
            { label: '获客', icon: Radar, href: '/c/radar' },
            { label: '内容', icon: FileText, href: '/c/marketing' },
            { label: '社媒', icon: Globe, href: '/c/social' },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs text-slate-400 hover:text-white"
            >
              <item.icon size={14} />
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Pending Actions */}
        <div className="bg-[#FFFCF6] rounded-[2rem] border border-[#E7E0D3] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#0B1B2B]">待您拍板推进</h3>
            <Link href="/c/hub" className="text-xs text-[#C7A56A] hover:underline flex items-center gap-1">
              查看全部
              <ArrowUpRight size={12} />
            </Link>
          </div>
          
          {actions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 size={40} className="text-emerald-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">太棒了！没有待决策事项</p>
            </div>
          ) : (
            <div className="space-y-3">
              {actions.map((action) => (
                <div key={action.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#E7E0D3]">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getPriorityStyle(action.priority)}`}>
                    {action.priority}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-[#0B1B2B] block truncate">{action.title}</span>
                    <span className="text-[10px] text-slate-400">{action.module}</span>
                  </div>
                  <Link 
                    href={action.actionLink}
                    className="px-3 py-1.5 bg-[#C7A56A] text-[#0B1B2B] text-xs font-bold rounded-lg hover:bg-[#C7A56A]/90 transition-colors flex items-center gap-1"
                  >
                    {action.action}
                    <ChevronRight size={12} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Strategic Advisor */}
        <div className="bg-[#FFFCF6] rounded-[2rem] border border-[#E7E0D3] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#C7A56A] to-[#C7A56A]/80 rounded-xl flex items-center justify-center">
              <Sparkles size={18} className="text-[#0B1B2B]" />
            </div>
            <div>
              <h2 className="font-bold text-[#0B1B2B]">VertaX 出海战略顾问</h2>
              <p className="text-xs text-emerald-500">在线 · 深度了解您的业务</p>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-2 mb-4">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt.label}
                onClick={() => setInputValue(prompt.label)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E7E0D3] rounded-lg text-xs text-slate-600 hover:border-[#C7A56A]/50 hover:text-[#0B1B2B] transition-colors"
              >
                <prompt.icon size={12} />
                {prompt.label}
              </button>
            ))}
          </div>

          <p className="text-[10px] text-slate-400 mb-3">
            点击快捷指令或直接提问<br />
            已同步您的产品、客户、进展数据
          </p>

          {/* Chat Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="请指示..."
              className="flex-1 px-4 py-2.5 bg-white border border-[#E7E0D3] rounded-xl text-sm focus:outline-none focus:border-[#C7A56A] transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="px-4 py-2.5 bg-[#0B1B2B] text-[#C7A56A] rounded-xl hover:bg-[#10263B] transition-colors disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
