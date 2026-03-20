import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()

  // 检查用户是否登录
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 检查用户角色 - 从 users 表获取
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    redirect('/leads')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          运营后台
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <a
            href="/admin/users"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">用户管理</h2>
            <p className="text-gray-600">查看和管理所有用户</p>
          </a>

          <a
            href="/admin/companies"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">公司管理</h2>
            <p className="text-gray-600">查看所有公司数据</p>
          </a>

          <a
            href="/admin/analytics"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">数据分析</h2>
            <p className="text-gray-600">查看运营数据</p>
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">快速操作</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/admin/settings"
              className="bg-blue-50 p-4 rounded hover:bg-blue-100 transition-colors text-center"
            >
              ⚙️ 系统设置
            </a>
            <a
              href="/admin/api-keys"
              className="bg-purple-50 p-4 rounded hover:bg-purple-100 transition-colors text-center"
            >
              🔑 API 密钥
            </a>
            <a
              href="/leads"
              className="bg-green-50 p-4 rounded hover:bg-green-100 transition-colors text-center"
            >
              📋 返回用户端
            </a>
            <a
              href="https://app.supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-orange-50 p-4 rounded hover:bg-orange-100 transition-colors text-center"
            >
              🗄️ 数据库管理
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}