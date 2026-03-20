// 强制动态渲染，禁用缓存
export const dynamic = 'force-dynamic'

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          运营后台
        </h1>
        <p className="text-gray-600 mb-4">
          管理员后台已成功加载！
        </p>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-700">如果您看到这个页面，说明路由配置正确。</p>
        </div>
      </div>
    </div>
  )
}
