export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-[oklch(0.6_0.27_340)] to-[oklch(0.65_0.28_25)] items-center justify-center relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-md text-primary-foreground p-8 relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">VV</span>
            </div>
            <h1 className="text-4xl font-bold">ViciVidi AI</h1>
          </div>
          
          <p className="text-lg opacity-90 mb-8">
            AI驱动的B2B销售线索研究平台，帮你找到精准客户。
          </p>
          
          <ul className="space-y-4">
            <li className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
              <span className="w-2 h-2 bg-white rounded-full" />
              公司智能匹配
            </li>
            <li className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
              <span className="w-2 h-2 bg-white rounded-full" />
              数据自动丰富
            </li>
            <li className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
              <span className="w-2 h-2 bg-white rounded-full" />
              邮箱精准验证
            </li>
          </ul>
          
          {/* Powered by Caesar Engine */}
          <div className="mt-12 pt-6 border-t border-white/20">
            <p className="text-sm opacity-70">
              Powered by{' '}
              <span className="font-semibold text-white">
                Caesar Engine
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}