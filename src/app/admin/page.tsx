import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let userData = null
  if (user) {
    const result = await supabase
      .from('users')
      .select('role, email, name')
      .eq('id', user.id)
      .single()
    userData = result.data
  }

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
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">ViciVidi Admin</h1>
            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{userData?.email}</span>
            <a href="/leads" className="text-sm text-blue-600 hover:underline">Back to App</a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{totalUsers || 0}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                👥
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Companies</p>
                <p className="text-3xl font-bold text-gray-900">{totalCompanies || 0}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                🏢
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Leads</p>
                <p className="text-3xl font-bold text-gray-900">{totalLeads || 0}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                📋
              </div>
            </div>
          </div>
        </div>

        {/* Feature nav */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/users"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">👥</div>
              <div>
                <h3 className="font-semibold text-gray-900">Users</h3>
                <p className="text-sm text-gray-500">View and manage all users</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/credits"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-l-4 border-yellow-500"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center text-xl">🪙</div>
              <div>
                <h3 className="font-semibold text-gray-900">Credits</h3>
                <p className="text-sm text-gray-500">View and manually adjust user credits</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/companies"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">🏢</div>
              <div>
                <h3 className="font-semibold text-gray-900">Companies</h3>
                <p className="text-sm text-gray-500">View all company data</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/analytics"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-l-4 border-purple-500"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">📊</div>
              <div>
                <h3 className="font-semibold text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-500">View operational statistics</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/settings"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-l-4 border-orange-500"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl">⚙️</div>
              <div>
                <h3 className="font-semibold text-gray-900">Settings</h3>
                <p className="text-sm text-gray-500">Configure system parameters</p>
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
              <div className="h-10 w-10 bg-teal-100 rounded-lg flex items-center justify-center text-xl">🗄️</div>
              <div>
                <h3 className="font-semibold text-gray-900">Database</h3>
                <p className="text-sm text-gray-500">Open Supabase console</p>
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
              <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center text-xl">💳</div>
              <div>
                <h3 className="font-semibold text-gray-900">Payments</h3>
                <p className="text-sm text-gray-500">Open Stripe dashboard</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
