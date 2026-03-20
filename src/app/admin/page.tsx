import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createClient()

  // 检查用户是否登录
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 检查用户角色
  const { data: userData } = await supabase
    .from('users')
    .select('role, email, name')
    .eq('id', user.id)
    .single()

  // 临时开发模式：允许管理员邮箱直接访问（用于首次设置）
  const isAdminEmail = userData?.email === 'congrenmao799@gmail.com'
  
  if (userData?.role !== 'admin' && !isAdminEmail) {
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
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">ViciVidi 运营后台</h1>
            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">管理员</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{userData?.email}</span>
            <a href="/leads" className="text-sm text-blue-600 hover:underline">返回用户端 →</a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总用户数</p>
                <p className="text-3xl font-bold text-gray-900">{totalUsers || 0}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">公司总数</p>
                <p className="text-3xl font-bold text-gray-900">{totalCompanies || 0}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🏢</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">线索总数</p>
                <p className="text-3xl font-bold text-gray-900">{totalLeads || 0}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>
        </div>

        {/* 功能入口 */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">功能管理</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/users"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">👥</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">用户管理</h3>
                <p className="text-sm text-gray-500">查看和管理所有用户</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/companies"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🏢</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">公司管理</h3>
                <p className="text-sm text-gray-500">查看所有公司数据</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/analytics"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-l-4 border-purple-500"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">数据分析</h3>
                <p className="text-sm text-gray-500">查看运营数据统计</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/settings"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-l-4 border-orange-500"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">⚙️</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">系统设置</h3>
                <p className="text-sm text-gray-500">配置系统参数</p>
              </div>
            </div>
          </Link>

          <a
            href="https://app.supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-l-4 border-teal-500"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🗄️</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">数据库管理</h3>
                <p className="text-sm text-gray-500">打开 Supabase 控制台</p>
              </div>
            </div>
          </a>

          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-l-4 border-indigo-500"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">💳</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">支付管理</h3>
                <p className="text-sm text-gray-500">打开 Stripe 控制台</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
