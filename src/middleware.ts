import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from './i18n/request'

export function middleware(request: NextRequest) {
  const locale = request.cookies.get('locale')?.value || defaultLocale

  const response = NextResponse.next()
  response.headers.set('x-locale', locale)

  return response
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|images).*)'],
}