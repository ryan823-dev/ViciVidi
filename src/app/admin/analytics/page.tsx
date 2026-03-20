import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    redirect('/leads')
  }

  // 获取统计数据
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  const { count: totalCompanies } = await supabase
    .from('workspace_companies')
    .select('*', { count: 'exact', head: true })

  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })

  // 获取最近注册的用户
  const { data: recentUsers } = await supabase
    .from('users')
    .select('email, name, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-gray-500 hover:text-gray-700">← 返回</a>
            <h1 className="text-xl font-bold text-gray-900">数据分析</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 核心指标 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="text-4xl mb-2">👥</div>
              <div className="text-4xl font-bold text-blue-600 mb-2">{totalUsers || 0}</div>
              <div className="text-gray-500">注册用户</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🏢</div>
              <div className="text-4xl font-bold text-green-600 mb-2">{totalCompanies || 0}</div>
              <div className="text-gray-500">公司总数</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="text-4xl mb-2">📋</div>
              <div className="text-4xl font-bold text-purple-600 mb-2">{totalLeads || 0}</div>
              <div className="text-gray-500">线索总数</div>
            </div>
          </div>
        </div>

        {/* 最近注册用户 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">最近注册用户</h2>
          </div>
          
          {recentUsers && recentUsers.length > 0 ? (
            <div className="divide-y">
              {recentUsers.map((u: any, index: number) => (
                <div key={index} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{u.email}</div>
                    {u.name && <div className="text-sm text-gray-500">{u.name}</div>}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(u.created_at).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              暂无用户数据
            </div>
          )}
        </div>

        {/* 快速链接 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="https://app.supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow flex items-center gap-4"
          >
            <div className="h-10 w-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🗄️</span>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Supabase 控制台</div>
              <div className="text-sm text-gray-500">查看数据库和实时数据</div>
            </div>
          </a>

          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow flex items-center gap-4"
          >
            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">☁️</span>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Vercel 控制台</div>
              <div className="text-sm text-gray-500">查看部署和日志</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
