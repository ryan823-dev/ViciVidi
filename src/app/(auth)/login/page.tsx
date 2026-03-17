'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { LanguageSwitcher } from '@/components/language-switcher'

export default function LoginPage() {
  const t = useTranslations('auth.login')
  const tFooter = useTranslations('footer')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // 开发模式：模拟登录
    const isDev = process.env.NODE_ENV === 'development'
    const hasSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                              process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co'

    if (!hasSupabaseConfig && isDev) {
      // 模拟登录成功
      setTimeout(() => {
        router.push('/leads')
      }, 500)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? t('invalidCredentials')
        : error.message)
    } else {
      router.push('/leads')
      router.refresh()
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      
      if (error) {
        console.error('Google login error:', error)
        setError('Google login failed: ' + error.message)
      }
    } catch (err) {
      console.error('Google login exception:', err)
      setError('Google login failed. Please try again.')
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[oklch(0.65_0.28_25)]/10 rounded-full blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md shadow-2xl border-primary/10">
        {/* Logo 区域 */}
        <div className="pt-8 pb-4 flex justify-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-[oklch(0.55_0.30_320)] to-[oklch(0.65_0.28_25)] rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl p-2">
              <img src="/logo.svg" alt="ViciVidi AI Logo" className="w-full h-full" />
            </div>
          </div>
        </div>
        
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-[oklch(0.55_0.30_320)] to-[oklch(0.65_0.28_25)] bg-clip-text text-transparent">
            {t('title')}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {t('subtitle')}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          <Button
            variant="outline"
            className="w-full h-12 text-base border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
            onClick={handleGoogleLogin}
          >
            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {t('googleLogin')}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">
                {t('orEmail')}
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-[oklch(0.65_0.28_25)] hover:opacity-90 transition-opacity shadow-lg" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('signingIn')}
                </span>
              ) : t('signIn')}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center pb-8">
          <p className="text-sm text-muted-foreground">
            {t('noAccount')}{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              {t('register')}
            </Link>
          </p>
        </CardFooter>

        {/* Footer Links */}
        <div className="px-6 pb-4 flex justify-center gap-4">
          <Link href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <span className="text-xs text-muted-foreground">•</span>
          <Link href="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Terms of Service
          </Link>
        </div>

        {/* Powered by Caesar Engine */}
        <div className="px-6 pb-6 flex justify-center">
          <p className="text-xs text-muted-foreground text-center">
            {tFooter('poweredBy')}{' '}
            <span className="font-medium bg-gradient-to-r from-[oklch(0.58_0.13_65)] to-[oklch(0.72_0.19_75)] bg-clip-text text-transparent">
              {tFooter('caesarEngine')}
            </span>
          </p>
        </div>
      </Card>
    </div>
  )
}