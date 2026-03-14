'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'
import Link from 'next/link'

export default function PaymentCancelledPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <XCircle className="h-16 w-16 mx-auto text-destructive" />
          <CardTitle className="mt-4">支付已取消</CardTitle>
          <CardDescription>
            您取消了支付流程
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>如有任何问题，请随时联系客服</p>
            <p>或重新尝试订阅</p>
          </div>

          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => window.location.href = '/companies'}>返回公司</Button>
            <Button onClick={() => window.location.href = '/settings/quota'}>重新订阅</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
