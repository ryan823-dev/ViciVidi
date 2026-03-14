/**
 * API 密钥配置获取工具
 * 优先从数据库读取，其次从环境变量读取
 */

import { prisma } from './prisma'

interface ApiKeyResult {
  apiKey: string | null
  apiSecret: string | null
  isEnabled: boolean
}

/**
 * 获取指定服务的API密钥配置
 * @param service 服务ID
 * @param workspaceId 工作空间ID
 * @returns API密钥配置
 */
export async function getApiKey(
  service: string,
  workspaceId: string
): Promise<ApiKeyResult> {
  try {
    // 尝试从数据库获取
    const config = await prisma.apiKeyConfig.findUnique({
      where: {
        service
      }
    })

    if (config && config.apiKey && config.isEnabled) {
      // 更新最后使用时间
      await prisma.apiKeyConfig.update({
        where: { service },
        data: { lastUsedAt: new Date() }
      }).catch(() => {})

      return {
        apiKey: config.apiKey,
        apiSecret: config.apiSecret,
        isEnabled: config.isEnabled,
      }
    }
  } catch (error) {
    console.error('从数据库获取API密钥失败:', error)
  }

  // 从环境变量获取
  return getApiKeyFromEnv(service)
}

/**
 * 从环境变量获取API密钥
 */
function getApiKeyFromEnv(service: string): ApiKeyResult {
  const envMappings: Record<string, { key: string; secret?: string }> = {
    google_places: { key: 'GOOGLE_PLACES_API_KEY' },
    brave_search: { key: 'BRAVE_SEARCH_API_KEY' },
    apollo: { key: 'APOLLO_API_KEY' },
    skrapp: { key: 'SKRAPP_API_KEY' },
    hunter: { key: 'HUNTER_API_KEY' },
    firecrawl: { key: 'FIRECRAWL_API_KEY' },
    companies_house: { key: 'COMPANIES_HOUSE_API_KEY' },
    qcc: { key: 'QCC_API_KEY', secret: 'QCC_SECRET_KEY' },
    tyc: { key: 'TYC_API_KEY' },
  }

  const mapping = envMappings[service]
  if (!mapping) {
    return { apiKey: null, apiSecret: null, isEnabled: false }
  }

  const apiKey = process.env[mapping.key] || null
  const apiSecret = mapping.secret ? (process.env[mapping.secret] || null) : null

  return {
    apiKey,
    apiSecret,
    isEnabled: !!apiKey,
  }
}

/**
 * 批量获取多个服务的API密钥
 */
export async function getApiKeys(
  services: string[],
  workspaceId: string
): Promise<Record<string, ApiKeyResult>> {
  const results: Record<string, ApiKeyResult> = {}

  for (const service of services) {
    results[service] = await getApiKey(service, workspaceId)
  }

  return results
}

/**
 * 检查服务是否可用
 */
export async function isServiceAvailable(
  service: string,
  workspaceId: string
): Promise<boolean> {
  const { apiKey, isEnabled } = await getApiKey(service, workspaceId)
  return !!apiKey && isEnabled
}