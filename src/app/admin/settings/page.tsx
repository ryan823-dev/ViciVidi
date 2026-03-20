import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminSettingsPage() {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-gray-500 hover:text-gray-700">← 返回</a>
            <h1 className="text-xl font-bold text-gray-900">系统设置</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 站点信息 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">站点信息</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-500">站点名称</label>
                <div className="text-sm font-medium text-gray-900">ViciVidi AI</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">站点地址</label>
                <div className="text-sm font-medium text-gray-900">https://vicividi.com</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">支持邮箱</label>
                <div className="text-sm font-medium text-gray-900">support@vicividi.com</div>
              </div>
            </div>
          </div>

          {/* 外部服务 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">外部服务</h2>
            </div>
            <div className="p-6 space-y-4">
              <a
                href="https://app.supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🗄️</span>
                  <div>
                    <div className="font-medium text-gray-900">Supabase</div>
                    <div className="text-sm text-gray-500">数据库和认证</div>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </a>
              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">💳</span>
                  <div>
                    <div className="font-medium text-gray-900">Stripe</div>
                    <div className="text-sm text-gray-500">支付和订阅管理</div>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </a>
              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">☁️</span>
                  <div>
                    <div className="font-medium text-gray-900">Vercel</div>
                    <div className="text-sm text-gray-500">部署和域名管理</div>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </a>
            </div>
          </div>

          {/* 管理员操作 */}
          <div className="bg-white rounded-lg shadow md:col-span-2">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">管理员操作</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a
                  href="/admin/users"
                  className="p-4 border rounded-lg hover:bg-gray-50 text-center"
                >
                  <div className="text-2xl mb-2">👥</div>
                  <div className="font-medium">管理用户</div>
                  <div className="text-sm text-gray-500">查看所有用户</div>
                </a>
                <a
                  href="/admin/companies"
                  className="p-4 border rounded-lg hover:bg-gray-50 text-center"
                >
                  <div className="text-2xl mb-2">🏢</div>
                  <div className="font-medium">管理公司</div>
                  <div className="text-sm text-gray-500">查看所有公司</div>
                </a>
                <a
                  href="/admin/analytics"
                  className="p-4 border rounded-lg hover:bg-gray-50 text-center"
                >
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-medium">数据统计</div>
                  <div className="text-sm text-gray-500">查看运营数据</div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
