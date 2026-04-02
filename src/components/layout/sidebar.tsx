'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  Building2,
  BarChart3,
  Menu,
  X,
  Target,
  Settings,
  LogOut,
  CreditCard,
  Users,
  ScanSearch,
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
    {
      href: '/discover',
      label: '\u667a\u80fd\u6316\u5ba2',
      icon: ScanSearch,
      highlight: true,
    },
    { href: '/leads', label: t('leads'), icon: Target },
    { href: '/companies', label: t('companies'), icon: Building2 },
    { href: '/analytics', label: t('analytics'), icon: BarChart3 },
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
          {/* Logo Header */}
          <div className="relative px-6 py-5 border-b bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-[oklch(0.55_0.30_320)] to-[oklch(0.65_0.28_25)] rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg p-1.5 border border-primary/20">
                  <img src="/logo.svg" alt="ViciVidi AI" className="w-full h-full" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold text-xl bg-gradient-to-r from-primary via-[oklch(0.55_0.30_320)] to-[oklch(0.65_0.28_25)] bg-clip-text text-transparent leading-tight">ViciVidi</span>
                  <span className="text-xs font-semibold text-primary/70">AI</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] text-muted-foreground font-medium tracking-wide uppercase">Powered by</span>
                  <span className="text-[9px] font-semibold bg-gradient-to-r from-[oklch(0.58_0.13_65)] to-[oklch(0.72_0.19_75)] bg-clip-text text-transparent">Caesar Engine</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))

              if (item.highlight) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold transition-all mb-1",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {!isActive && (
                      <span className="ml-auto text-[9px] font-bold uppercase tracking-wide bg-primary text-primary-foreground rounded px-1 py-0.5">
                        NEW
                      </span>
                    )}
                  </Link>
                )
              }

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
