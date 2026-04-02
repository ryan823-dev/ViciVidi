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
  Zap,
  Activity,
  Home,
  ChevronRight,
} from 'lucide-react'
import { useState, useEffect } from 'react'
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

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  highlight?: boolean
  badge?: string
}

interface CreditBalance {
  balance: number
  plan: string
  hasSubscription: boolean
}

function CreditWidget({ balance }: { balance: CreditBalance | null }) {
  if (!balance) return null

  const pct = Math.min(100, Math.max(0, balance.hasSubscription ? balance.balance / 300 * 100 : 0))
  const low = balance.balance < 50

  return (
    <Link
      href="/billing"
      className={cn(
        'mx-3 my-2 rounded-xl p-3 flex flex-col gap-2 border transition-colors group',
        low
          ? 'bg-red-50 border-red-200 hover:bg-red-100'
          : 'bg-primary/5 border-primary/15 hover:bg-primary/10'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className={cn('h-3.5 w-3.5', low ? 'text-red-500' : 'text-amber-500')} />
          <span className={cn('text-xs font-semibold', low ? 'text-red-700' : 'text-primary')}>
            {balance.balance.toLocaleString()} credits
          </span>
        </div>
        <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </div>
      <div className="h-1 rounded-full bg-black/10 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            low ? 'bg-red-400' : 'bg-gradient-to-r from-amber-400 to-primary'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[10px] text-muted-foreground">
        {balance.hasSubscription ? balance.plan : 'Free Trial'}
        {low && ' · Low balance'}
      </div>
    </Link>
  )
}

export function Sidebar() {
  const t = useTranslations('nav')
  const tFooter = useTranslations('footer')
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [credits, setCredits] = useState<CreditBalance | null>(null)

  useEffect(() => {
    fetch('/api/credits/balance')
      .then((r) => r.json())
      .then((data) => setCredits(data))
      .catch(() => {})
  }, [])

  const mainNav: NavItem[] = [
    {
      href: '/discover',
      label: '\u667a\u80fd\u6316\u5ba2',
      icon: ScanSearch,
      highlight: true,
      badge: 'NEW',
    },
    { href: '/dashboard', label: '\u4eea\u8868\u76d8', icon: Home },
    { href: '/leads', label: t('leads'), icon: Target },
    { href: '/companies', label: t('companies'), icon: Building2 },
    { href: '/analytics', label: t('analytics'), icon: BarChart3 },
  ]

  const bottomNav: NavItem[] = [
    { href: '/team', label: t('team'), icon: Users },
    { href: '/billing', label: t('billing'), icon: CreditCard },
    { href: '/intent-dashboard', label: '\u610f\u56fe\u76d1\u63a7', icon: Activity },
  ]

  function NavLink({ item }: { item: NavItem }) {
    const Icon = item.icon
    const isActive =
      pathname === item.href ||
      (item.href !== '/dashboard' && pathname.startsWith(item.href))

    if (item.highlight) {
      return (
        <Link
          href={item.href}
          onClick={() => setMobileOpen(false)}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
            isActive
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-gradient-to-r from-primary/10 to-[oklch(0.65_0.28_25)]/10 text-primary hover:from-primary/20 hover:to-[oklch(0.65_0.28_25)]/20 border border-primary/20'
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">{item.label}</span>
          {!isActive && item.badge && (
            <span className="text-[9px] font-bold uppercase tracking-wide bg-primary text-primary-foreground rounded px-1.5 py-0.5">
              {item.badge}
            </span>
          )}
        </Link>
      )
    }

    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{item.label}</span>
      </Link>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* ── Logo ── */}
      <div className="relative px-5 py-5 border-b bg-gradient-to-br from-primary/8 via-transparent to-transparent">
        <div className="flex items-center gap-3">
          <div className="relative group shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-[oklch(0.55_0.30_320)] to-[oklch(0.65_0.28_25)] rounded-xl blur-md opacity-60 group-hover:opacity-90 transition-opacity" />
            <div className="relative w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-md p-1.5 border border-primary/20">
              <img src="/logo.svg" alt="ViciVidi AI" className="w-full h-full" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-lg bg-gradient-to-r from-primary via-[oklch(0.55_0.30_320)] to-[oklch(0.65_0.28_25)] bg-clip-text text-transparent leading-tight">
                ViciVidi
              </span>
              <span className="text-[11px] font-bold text-primary/60">AI</span>
            </div>
            <div className="text-[9px] text-muted-foreground font-medium tracking-wide uppercase">
              Powered by Caesar Engine
            </div>
          </div>
        </div>
      </div>

      {/* ── Credit widget ── */}
      <CreditWidget balance={credits} />

      {/* ── Main nav ── */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <div className="space-y-0.5">
          {mainNav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        {/* Divider */}
        <div className="my-3 border-t" />

        <div className="space-y-0.5">
          {bottomNav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </nav>

      {/* ── Language switcher ── */}
      <div className="px-3 py-2 border-t">
        <LanguageSwitcher />
      </div>

      {/* ── User menu ── */}
      <div className="px-3 py-3 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-3 hover:bg-accent rounded-lg"
              />
            }
          >
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src="" />
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">U</AvatarFallback>
            </Avatar>
            <span className="truncate text-sm">User</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
              <Settings className="h-4 w-4 mr-2" />
              {t('settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive gap-2">
              <LogOut className="h-4 w-4" />
              {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-background rounded-md border shadow-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-60 bg-card border-r transform transition-transform duration-200 lg:translate-x-0',
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
