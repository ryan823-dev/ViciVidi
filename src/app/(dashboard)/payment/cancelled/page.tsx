'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'

export default function PaymentCancelledPage() {
  const t = useTranslations('payment.cancelled')
  
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <XCircle className="h-16 w-16 mx-auto text-destructive" />
          <CardTitle className="mt-4">{t('title')}</CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>If you have any questions, please contact support</p>
            <p>or try again</p>
          </div>

          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => window.location.href = '/companies'}>Back to Companies</Button>
            <Button onClick={() => window.location.href = '/settings/quota'}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}