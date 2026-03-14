'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2 } from 'lucide-react'

function PaymentContent() {
  const searchParams = useSearchParams()
  const [processing, setProcessing] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    
    if (sessionId) {
      // 验证支付会话
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
      setSuccess(true) // 开发模式
    }
  }, [searchParams])

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {processing ? (
            <>
              <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
              <CardTitle className="mt-4">处理支付结果...</CardTitle>
              <CardDescription>请稍候，正在确认您的支付</CardDescription>
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
              <CardTitle className="mt-4">支付成功！</CardTitle>
              <CardDescription>
                感谢您的订阅，套餐已立即生效
              </CardDescription>
            </>
          ) : (
            <>
              <div className="h-16 w-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                <span className="text-2xl">✕</span>
              </div>
              <CardTitle className="mt-4">支付失败</CardTitle>
              <CardDescription>
                抱歉，支付处理出现问题
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="text-center space-y-4">
          {!processing && (
            <>
              {success && (
                <div className="text-sm text-muted-foreground">
                  <p>您可以立即开始使用新功能</p>
                  <p>前往配额页面查看详情</p>
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => window.location.href = '/companies'}>返回公司</Button>
                <Button onClick={() => window.location.href = '/settings/quota'}>查看配额</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
            <CardTitle className="mt-4">加载中...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}
