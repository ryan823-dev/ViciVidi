"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight,
  Loader2,
  RefreshCw,
  Brain,
  Radar,
  FileText,
  Globe,
  Activity,
  ChevronRight,
  Zap,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  getSystemTodos,
  getHubStats,
  getModuleHealth,
  getRecentActivity,
  type TodoItem,
  type HubStats,
  type ModuleHealth,
  type RecentActivity,
} from '@/actions/hub';

// Icon mapping
const MODULE_ICONS: Record<string, typeof Brain> = {
  brain: Brain,
  radar: Radar,
  'file-text': FileText,
  globe: Globe,
};

export default function HubPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [stats, setStats] = useState<HubStats>({ pending: 0, blocked: 0, inProgress: 0, completed: 0 });
  const [moduleHealth, setModuleHealth] = useState<ModuleHealth[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);

  // 加载数据
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [todosData, statsData, healthData, activityData] = await Promise.all([
        getSystemTodos(),
        getHubStats(),
        getModuleHealth(),
        getRecentActivity(5),
      ]);
      setTodos(todosData);
      setStats(statsData);
      setModuleHealth(healthData);
      setActivities(activityData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 获取优先级样式
  const getPriorityStyle = (priority: string) => {
    const styles: Record<string, string> = {
      P0: 'bg-red-100 text-red-600',
      P1: 'bg-amber-100 text-amber-600',
      P2: 'bg-blue-100 text-blue-600',
      P3: 'bg-slate-100 text-slate-600',
    };
    return styles[priority] || styles.P3;
  };

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    const styles: Record<string, { label: string; color: string }> = {
      pending: { label: '待处理', color: 'bg-amber-50 text-amber-600' },
      in_progress: { label: '进行中', color: 'bg-blue-50 text-blue-600' },
      completed: { label: '已完成', color: 'bg-emerald-50 text-emerald-600' },
    };
    return styles[status] || styles.pending;
  };

  // 获取健康状态样式
  const getHealthStyle = (status: string) => {
    const styles: Record<string, string> = {
      healthy: 'bg-emerald-500',
      warning: 'bg-amber-500',
      error: 'bg-red-500',
    };
    return styles[status] || styles.warning;
  };

  // 获取模块图标
  const getModuleIcon = (iconName: string) => {
    return MODULE_ICONS[iconName] || ClipboardList;
  };

  // 获取活动描述
  const getActivityDescription = (activity: RecentActivity) => {
    const actionMap: Record<string, string> = {
      create: '创建了',
      update: '更新了',
      delete: '删除了',
      publish: '发布了',
      analyze: '分析了',
    };
    const entityMap: Record<string, string> = {
      lead: '线索',
      content: '内容',
      post: '社媒帖子',
      profile: '企业画像',
      asset: '素材',
    };
    return `${actionMap[activity.action] || activity.action} ${entityMap[activity.entityType] || activity.entityType}`;
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
          <h1 className="text-2xl font-bold text-[#0B1B2B]">推进中台</h1>
          <p className="text-sm text-slate-500 mt-1">任务跟踪与待办事项管理</p>
        </div>
        <button 
          onClick={loadData}
          className="p-2 text-slate-400 hover:text-[#C7A56A] transition-colors"
        >
          <RefreshCw size={18} />
        </button>
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
          { label: '待处理', value: stats.pending, icon: Clock, color: 'text-amber-500' },
          { label: 'P0阻塞', value: stats.blocked, icon: AlertCircle, color: 'text-red-500' },
          { label: '进行中', value: stats.inProgress, icon: ArrowRight, color: 'text-blue-500' },
          { label: '已完成', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-500' },
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

      <div className="grid grid-cols-3 gap-6">
        {/* Todo List */}
        <div className="col-span-2 bg-[#FFFCF6] rounded-2xl border border-[#E7E0D3] p-6">
          <h3 className="font-bold text-[#0B1B2B] mb-4 flex items-center gap-2">
            <ClipboardList size={18} className="text-[#C7A56A]" />
            待办事项
          </h3>
          
          {todos.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 size={48} className="text-emerald-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-[#0B1B2B] mb-2">太棒了！</p>
              <p className="text-slate-500">没有待处理事项</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {todos.map((todo) => {
                const Icon = getModuleIcon(todo.moduleIcon);
                const statusInfo = getStatusStyle(todo.status);
                return (
                  <div 
                    key={todo.id} 
                    className="flex items-center gap-4 p-4 bg-white border border-[#E7E0D3] rounded-xl hover:border-[#C7A56A]/30 transition-colors"
                  >
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${getPriorityStyle(todo.priority)}`}>
                      {todo.priority}
                    </span>
                    <div className="w-8 h-8 bg-[#F7F3EA] rounded-lg flex items-center justify-center">
                      <Icon size={16} className="text-[#C7A56A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-[#0B1B2B]">{todo.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{todo.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1">来自：{todo.module}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    {todo.actionLink ? (
                      <Link 
                        href={todo.actionLink}
                        className="px-4 py-2 bg-[#C7A56A] text-[#0B1B2B] text-xs font-bold rounded-lg hover:bg-[#C7A56A]/90 transition-colors flex items-center gap-1"
                      >
                        {todo.action}
                        <ChevronRight size={12} />
                      </Link>
                    ) : (
                      <button className="px-4 py-2 bg-[#C7A56A] text-[#0B1B2B] text-xs font-bold rounded-lg hover:bg-[#C7A56A]/90 transition-colors">
                        {todo.action}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="col-span-1 space-y-6">
          {/* Module Health */}
          <div className="bg-[#FFFCF6] rounded-2xl border border-[#E7E0D3] p-6">
            <h3 className="font-bold text-[#0B1B2B] mb-4 flex items-center gap-2">
              <Activity size={18} className="text-[#C7A56A]" />
              模块健康度
            </h3>
            <div className="space-y-3">
              {moduleHealth.map((module, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${getHealthStyle(module.status)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0B1B2B]">{module.module}</p>
                    <p className="text-xs text-slate-400 truncate">{module.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#FFFCF6] rounded-2xl border border-[#E7E0D3] p-6">
            <h3 className="font-bold text-[#0B1B2B] mb-4 flex items-center gap-2">
              <Zap size={18} className="text-[#C7A56A]" />
              最近活动
            </h3>
            {activities.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-slate-400">暂无活动记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#F7F3EA] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <TrendingUp size={12} className="text-[#C7A56A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#0B1B2B]">
                        {activity.userName || '系统'} {getActivityDescription(activity)}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(activity.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Tips */}
          <div className="bg-gradient-to-br from-[#0B1B2B] to-[#152942] rounded-2xl p-6 text-white">
            <h3 className="font-bold mb-2">💡 今日建议</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              {todos.length > 0 
                ? `您有 ${todos.filter(t => t.priority === 'P0' || t.priority === 'P1').length} 个高优先级任务待处理，建议先完成这些任务。`
                : '所有任务已完成！可以考虑通过AI调研发掘新的潜在客户。'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
