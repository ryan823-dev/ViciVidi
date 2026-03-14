'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Building2,
  LayoutDashboard,
  List,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  CreditCard,
  Zap,
  Users,
  DollarSign,
  Clock,
  Copy,
  Bell,
  BarChart3,
  Key
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const navItems = [
  { href: '/dashboard', label: '概览', icon: LayoutDashboard },
  { href: '/companies', label: '公司', icon: Building2 },
  { href: '/lists', label: '列表', icon: List },
  { href: '/addons', label: '商店', icon: Zap },
  { href: '/team', label: '团队', icon: Users },
  { href: '/schedules', label: '定时', icon: Clock },
  { href: '/duplicates', label: '去重', icon: Copy },
  { href: '/notifications', label: '通知', icon: Bell },
  { href: '/analytics', label: '分析', icon: BarChart3 },
  { href: '/settings/quota', label: '配额', icon: TrendingUp },
  { href: '/costs', label: '成本', icon: DollarSign },
  { href: '/subscription/manage', label: '订阅', icon: CreditCard },
  { href: '/settings/api-keys', label: 'API密钥', icon: Key },
  { href: '/settings', label: '设置', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-background rounded-md border"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transform transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-4 border-b">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg bg-gradient-to-r from-primary to-[oklch(0.65_0.28_25)] bg-clip-text text-transparent">ViciVidi AI</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User menu */}
          <div className="px-3 py-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" className="w-full justify-start gap-3 px-3" />}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="truncate">用户</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    设置
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Powered by Caesar Engine */}
          <div className="px-6 py-3 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              Powered by{' '}
              <span className="font-medium bg-gradient-to-r from-[oklch(0.55_0.12_65)] to-[oklch(0.7_0.18_75)] bg-clip-text text-transparent">
                Caesar Engine
              </span>
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}