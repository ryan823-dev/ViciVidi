'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
import { LanguageSwitcher } from '@/components/language-switcher'

export function Sidebar() {
  const t = useTranslations('nav')
  const tFooter = useTranslations('footer')
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/companies', label: t('companies'), icon: Building2 },
    { href: '/lists', label: t('lists'), icon: List },
    { href: '/addons', label: t('addons'), icon: Zap },
    { href: '/team', label: t('team'), icon: Users },
    { href: '/schedules', label: t('schedules'), icon: Clock },
    { href: '/duplicates', label: t('duplicates'), icon: Copy },
    { href: '/notifications', label: t('notifications'), icon: Bell },
    { href: '/analytics', label: t('analytics'), icon: BarChart3 },
    { href: '/settings/quota', label: t('quota'), icon: TrendingUp },
    { href: '/costs', label: t('costs'), icon: DollarSign },
    { href: '/subscription/manage', label: t('billing'), icon: CreditCard },
    { href: '/settings/api-keys', label: t('apiKeys'), icon: Key },
    { href: '/settings', label: t('settings'), icon: Settings },
  ]

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
          <div className="flex items-center gap-3 px-6 py-4 border-b">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-[oklch(0.55_0.30_320)] to-[oklch(0.65_0.28_25)] rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg p-1">
                <img src="/logo.svg" alt="ViciVidi AI" className="w-full h-full" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg bg-gradient-to-r from-primary via-[oklch(0.55_0.30_320)] to-[oklch(0.65_0.28_25)] bg-clip-text text-transparent leading-tight">ViciVidi</span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide">AI</span>
            </div>
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

          {/* Language Switcher */}
          <div className="px-3 py-2 border-t">
            <LanguageSwitcher />
          </div>

          {/* User menu */}
          <div className="px-3 py-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" className="w-full justify-start gap-3 px-3" />}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="truncate">User</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('settings')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Powered by Caesar Engine */}
          <div className="px-6 py-3 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              {tFooter('poweredBy')}{' '}
              <span className="font-medium bg-gradient-to-r from-[oklch(0.55_0.12_65)] to-[oklch(0.7_0.18_75)] bg-clip-text text-transparent">
                {tFooter('caesarEngine')}
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