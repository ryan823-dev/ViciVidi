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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <a href="/admin" className="text-blue-600 hover:underline">← 返回后台首页</a>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">数据分析</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <div className="text-4xl mb-2">👥</div>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {totalUsers || 0}
              </div>
              <div className="text-gray-600">注册用户</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🏢</div>
              <div className="text-4xl font-bold text-green-600 mb-2">
                {totalCompanies || 0}
              </div>
              <div className="text-gray-600">公司总数</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📋</div>
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {totalLeads || 0}
              </div>
              <div className="text-gray-600">线索总数</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}