/**
 * 配额管理服务
 * 处理用户配额检查、消耗、查询
 */

import { prisma } from '@/lib/db'
import { Plan } from '@prisma/client'

// 套餐配额限制
const QUOTA_LIMITS: Record<Plan, {
  companies: number
  emailVerifications: number
  exports: number
}> = {
  STARTER: {
    companies: 1000,
    emailVerifications: 50,
    exports: 10,
  },
  PRO: {
    companies: 5000,
    emailVerifications: 200,
    exports: 50,
  },
  BUSINESS: {
    companies: 15000,
    emailVerifications: 500,
    exports: 200,
  },
  ENTERPRISE: {
    companies: Infinity,
    emailVerifications: Infinity,
    exports: Infinity,
  },
}

/**
 * 获取用户配额状态
 */
export async function getUserQuota(userId: string) {
  let quota = await prisma.userQuota.findUnique({
    where: { userId },
  })

  // 如果配额不存在，创建默认配额
  if (!quota) {
    quota = await prisma.userQuota.create({
      data: {
        userId,
        plan: 'STARTER',
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 天后
      },
    })
  }

  // 检查配额周期是否过期
  if (quota.periodEnd < new Date()) {
    // 重置配额
    quota = await prisma.userQuota.update({
      where: { userId },
      data: {
        usedCompanies: 0,
        usedEmailVerifications: 0,
        usedExports: 0,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })
  }

  return quota
}

/**
 * 检查配额是否充足
 */
export async function checkQuota(
  userId: string,
  resource: 'companies' | 'emailVerifications' | 'exports',
  amount: number = 1
): Promise<{
  allowed: boolean
  remaining: number
  limit: number
  used: number
}> {
  const quota = await getUserQuota(userId)
  const limits = QUOTA_LIMITS[quota.plan]
  
  const limit = limits[resource]
  const usedKey = `used${resource.charAt(0).toUpperCase() + resource.slice(1)}` as keyof typeof quota
  const used = quota[usedKey] as number

  // 无限配额
  if (limit === Infinity) {
    return {
      allowed: true,
      remaining: Infinity,
      limit: Infinity,
      used: 0,
    }
  }

  const remaining = limit - used
  const allowed = remaining >= amount

  return {
    allowed,
    remaining,
    limit,
    used,
  }
}

/**
 * 消耗配额
 */
export async function consumeQuota(
  userId: string,
  resource: 'companies' | 'emailVerifications' | 'exports',
  amount: number = 1
): Promise<void> {
  const check = await checkQuota(userId, resource, amount)
  
  if (!check.allowed) {
    throw new Error(
      `Quota exceeded for ${resource}. Remaining: ${check.remaining}, Required: ${amount}`
    )
  }

  const updateKey = `used${resource.charAt(0).toUpperCase() + resource.slice(1)}` as keyof typeof prisma.userQuota

  await prisma.userQuota.update({
    where: { userId },
    data: {
      [updateKey]: {
        increment: amount,
      },
    },
  })
}

/**
 * 增加配额（购买增值包后）
 */
export async function addQuota(
  userId: string,
  resource: 'emailVerifications',
  amount: number
): Promise<void> {
  const updateKey = 'extraEmailVerifications'

  await prisma.userQuota.update({
    where: { userId },
    data: {
      [updateKey]: {
        increment: amount,
      },
    },
  })
}

/**
 * 获取配额使用百分比
 */
export function getQuotaPercentage(
  used: number,
  limit: number
): number {
  if (limit === Infinity) {
    return 0
  }
  return Math.min(100, Math.round((used / limit) * 100))
}

/**
 * 升级用户套餐
 */
export async function upgradePlan(
  userId: string,
  newPlan: Plan
): Promise<void> {
  await prisma.userQuota.update({
    where: { userId },
    data: {
      plan: newPlan,
      // 不重置已用配额，新配额立即生效
    },
  })
}