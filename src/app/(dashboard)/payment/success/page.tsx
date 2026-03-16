'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2 } from 'lucide-react'

function PaymentContent() {
  const searchParams = useSearchParams()
  const t = useTranslations('payment.success')
  const tCommon = useTranslations('common')
  
  const [processing, setProcessing] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    
    if (sessionId) {
      fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setSuccess(true)
          }
        })
        .catch(console.error)
        .finally(() => {
          setProcessing(false)
        })
    } else {
      setProcessing(false)
      setSuccess(true)
    }
  }, [searchParams])

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {processing ? (
            <>
              <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
              <CardTitle className="mt-4">{tCommon('loading')}</CardTitle>
              <CardDescription>Processing your payment...</CardDescription>
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
              <CardTitle className="mt-4">{t('title')}</CardTitle>
              <CardDescription>
                {t('description')}
              </CardDescription>
            </>
          ) : (
            <>
              <div className="h-16 w-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                <span className="text-2xl">✕</span>
              </div>
              <CardTitle className="mt-4">{tCommon('error')}</CardTitle>
              <CardDescription>
                Payment processing failed
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="text-center space-y-4">
          {!processing && (
            <>
              {success && (
                <div className="text-sm text-muted-foreground">
                  <p>You can now start using the new features</p>
                  <p>Check the quota page for details</p>
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => window.location.href = '/companies'}>Back to Companies</Button>
                <Button onClick={() => window.location.href = '/settings/quota'}>View Quota</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  const tCommon = useTranslations('common')
  
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
            <CardTitle className="mt-4">{tCommon('loading')}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}