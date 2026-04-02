'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  CreditCard,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Coins,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

// ===== Types aligned with /api/admin/credits =====
interface UserOverview {
  userId: string
  email: string
  stripeCustomerId: string
  planName: string
  monthlyCredits: number
  subscriptionStatus: string
}

interface LedgerEntry {
  id: string
  type: string        // CreditType enum: MONTHLY_ALLOCATION, BONUS_GRANT, API_CONSUMPTION, FEATURE_USAGE, REFUND, ADJUSTMENT
  amount: number      // positive = credit, negative = debit
  balanceAfter: number
  description: string
  createdAt: string
}

interface UserDetail {
  userId: string
  email: string
  stripeCustomerId: string
  planName: string
  monthlyCredits: number
  subscriptionId?: string
}

const TX_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  MONTHLY_ALLOCATION: { label: '月度分配',   color: 'text-green-600' },
  BONUS_GRANT:        { label: '奖励赠送',   color: 'text-green-600' },
  API_CONSUMPTION:    { label: 'API 消耗',   color: 'text-red-500'   },
  FEATURE_USAGE:      { label: '功能使用',   color: 'text-red-500'   },
  REFUND:             { label: '退款返还',   color: 'text-blue-600'  },
  ADJUSTMENT:         { label: '人工调整',   color: 'text-orange-600'},
}

export default function AdminCreditsPage() {
  const [overview, setOverview] = useState<UserOverview[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // 详情面板
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 })
  const [detailLoading, setDetailLoading] = useState(false)

  // 调整积分表单
  const [adjustDelta, setAdjustDelta] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjustLoading, setAdjustLoading] = useState(false)

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/credits')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setOverview(data.overview ?? [])
    } catch {
      toast.error('加载积分概览失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUserDetail = useCallback(async (userId: string, page = 1) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/credits?userId=${userId}&page=${page}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSelectedUser(data.user)
      setLedger(data.ledger ?? [])
      setPagination(data.pagination)
    } catch {
      toast.error('加载用户积分详情失败')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  const handleAdjust = async () => {
    if (!selectedUser) return
    const delta = parseInt(adjustDelta, 10)
    if (isNaN(delta) || delta === 0) {
      toast.error('请输入有效的积分数量（非零整数）')
      return
    }
    if (!adjustReason.trim()) {
      toast.error('请填写调整原因')
      return
    }

    setAdjustLoading(true)
    try {
      const res = await fetch('/api/admin/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.userId, delta, reason: adjustReason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`积分调整成功：${data.previousBalance} → ${data.newBalance}`)
      setAdjustDelta('')
      setAdjustReason('')
      await Promise.all([fetchOverview(), fetchUserDetail(selectedUser.userId)])
    } catch (e: any) {
      toast.error(e.message ?? '积分调整失败')
    } finally {
      setAdjustLoading(false)
    }
  }

  const filtered = overview.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.stripeCustomerId.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin" className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm">
            <ArrowLeft className="h-4 w-4" /> 返回后台
          </Link>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            积分管理
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* ===== 左侧：用户列表 ===== */}
        <div className="w-80 shrink-0">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索用户..."
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={fetchOverview}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="divide-y max-h-[calc(100vh-180px)] overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-gray-400 text-sm">加载中...</div>
              ) : filtered.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">暂无用户</div>
              ) : (
                filtered.map((u) => (
                  <button
                    key={u.userId}
                    onClick={() => fetchUserDetail(u.userId)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      selectedUser?.userId === u.userId ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {u.email}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{u.stripeCustomerId}</div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="text-sm font-bold text-gray-900">{u.monthlyCredits.toLocaleString()}/mo</div>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                          {u.planName}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ===== 右侧：详情 ===== */}
        <div className="flex-1 space-y-4">
          {!selectedUser ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
              <Coins className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">选择左侧用户查看积分详情</p>
            </div>
          ) : (
            <>
              {/* 用户信息卡 */}
              <div className="bg-white rounded-lg shadow p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedUser.email}</h2>
                    <p className="text-sm text-gray-500">{selectedUser.stripeCustomerId}</p>
                    <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      {selectedUser.planName}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">月度积分</p>
                    <p className="text-3xl font-bold text-gray-900">{selectedUser.monthlyCredits.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Credits / mo</p>
                  </div>
                </div>
              </div>

              {/* 手动调整积分 */}
              <div className="bg-white rounded-lg shadow p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  手动调整积分
                </h3>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">积分数量（正数充值，负数扣除）</label>
                    <input
                      type="number"
                      value={adjustDelta}
                      onChange={(e) => setAdjustDelta(e.target.value)}
                      placeholder="例如：100 或 -50"
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">调整原因（必填）</label>
                    <input
                      type="text"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="例如：客服补偿"
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleAdjust}
                    disabled={adjustLoading}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {adjustLoading ? '提交中...' : '确认调整'}
                  </button>
                </div>
                {adjustDelta && !isNaN(parseInt(adjustDelta)) && (
                  <p className="text-xs text-gray-400 mt-2">
                    调整量：
                    <span className={`font-semibold ${parseInt(adjustDelta) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {parseInt(adjustDelta) > 0 ? '+' : ''}{parseInt(adjustDelta).toLocaleString()} Credits
                    </span>
                  </p>
                )}
              </div>

              {/* 积分流水 */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-5 py-4 border-b flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">积分流水记录</h3>
                  <span className="text-xs text-gray-400">共 {pagination.total} 条</span>
                </div>

                {detailLoading ? (
                  <div className="p-8 text-center text-gray-400 text-sm">加载中...</div>
                ) : ledger.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">暂无流水记录</div>
                ) : (
                  <>
                    <div className="divide-y">
                      {ledger.map((entry) => {
                        const txCfg = TX_TYPE_CONFIG[entry.type] ?? {
                          label: entry.type,
                          color: 'text-gray-600',
                        }
                        const isCredit = entry.amount > 0
                        return (
                          <div key={entry.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg ${isCredit ? 'bg-green-50' : 'bg-red-50'}`}>
                                {isCredit ? (
                                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{entry.description || txCfg.label}</div>
                                <div className="text-xs text-gray-400">
                                  {new Date(entry.createdAt).toLocaleString('zh-CN')}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-bold ${txCfg.color}`}>
                                {isCredit ? '+' : ''}{entry.amount.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-400">
                                balance after: {entry.balanceAfter.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* 分页 */}
                    {pagination.totalPages > 1 && (
                      <div className="px-5 py-3 border-t flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          第 {pagination.page} / {pagination.totalPages} 页
                        </span>
                        <div className="flex gap-1">
                          <button
                            disabled={pagination.page <= 1}
                            onClick={() => fetchUserDetail(selectedUser.userId, pagination.page - 1)}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => fetchUserDetail(selectedUser.userId, pagination.page + 1)}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
