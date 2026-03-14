'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface AddonPackage {
  amount: number
  price: number
  popular?: boolean
}

interface AddonStoreProps {
  resource: 'EMAIL_VERIFICATION' | 'COMPANY' | 'EXPORT'
  title: string
  description: string
  packages: AddonPackage[]
  unit: string
}

export function AddonStore({ resource, title, description, packages, unit }: AddonStoreProps) {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null)
  const [purchasing, setPurchasing] = useState(false)

  const handlePurchase = async (amount: number) => {
    setSelectedPackage(amount)
    setPurchasing(true)
    
    try {
      const response = await fetch('/api/addons/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource, amount }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '购买失败')
      }

      const data = await response.json()

      if (data.mock) {
        toast.success(data.message)
      } else {
        if (data.url) {
          window.location.href = data.url
        } else {
          throw new Error('未返回支付 URL')
        }
      }
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error(error instanceof Error ? error.message : '购买失败')
    } finally {
      setPurchasing(false)
      setSelectedPackage(null)
    }
  }

  const getSavePercentage = (price: number, basePrice: number): number => {
    return Math.round(((basePrice * packages[0].amount / price - 1) * 100) / packages[0].amount * 10) / 10
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              {title}
            </CardTitle>
            <CardDescription className="mt-1">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {packages.map((pkg) => {
            const savePercentage = pkg.popular ? getSavePercentage(pkg.price, packages[0].price) : 0
            
            return (
              <Card
                key={pkg.amount}
                className={`relative flex flex-col ${
                  pkg.popular ? 'border-primary shadow-lg' : ''
                } ${purchasing && selectedPackage === pkg.amount ? 'ring-2 ring-primary' : ''}`}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    最划算
                  </Badge>
                )}

                <CardHeader>
                  <CardTitle className="text-lg">
                    {pkg.amount} {unit}
                  </CardTitle>
                  <CardDescription>
                    一次性购买，永久有效
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="mb-4">
                    <span className="text-3xl font-bold">¥{pkg.price}</span>
                    {savePercentage > 0 && (
                      <p className="text-sm text-green-600 mt-1">
                        省 {savePercentage}%
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      立即到账
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      无有效期限制
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      可与其他套餐叠加
                    </li>
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handlePurchase(pkg.amount)}
                    disabled={purchasing}
                    variant={pkg.popular ? 'default' : 'outline'}
                  >
                    {purchasing && selectedPackage === pkg.amount ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      '立即购买'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
