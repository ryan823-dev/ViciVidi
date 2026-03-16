'use client'

import { NextIntlClientProvider } from 'next-intl'
import { type ReactNode } from 'react'

interface Props {
  locale: string
  messages: Record<string, unknown>
  children: ReactNode
}

export function IntlProvider({ locale, messages, children }: Props) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}