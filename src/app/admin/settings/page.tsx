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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <a href="/admin" className="text-blue-600 hover:underline">← 返回后台首页</a>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">系统设置</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">站点配置</h2>
            <div className="space-y-4 text-gray-600">
              <p>站点名称：ViciVidi AI</p>
              <p>站点地址：https://vicividi.com</p>
              <p>支持邮箱：support@vicividi.com</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">快速链接</h2>
            <div className="space-y-3">
              <a
                href="https://app.supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                🗄️ Supabase 数据库管理
              </a>
              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                ☁️ Vercel 部署管理
              </a>
              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                💳 Stripe 支付管理
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}