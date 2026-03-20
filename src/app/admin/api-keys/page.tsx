import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminApiKeysPage() {
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

        <h1 className="text-3xl font-bold text-gray-900 mb-8">API 密钥管理</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🔑</div>
            <p className="text-gray-600 mb-4">
              API 密钥功能正在开发中...
            </p>
            <p className="text-sm text-gray-500">
              您可以在 Supabase 后台管理 API 访问
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}