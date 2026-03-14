/**
 * Generic Webhook Export Service
 * 
 * Allows users to configure custom webhooks to send lead data to any CRM or system.
 * Supports multiple webhook endpoints, custom payloads, and authentication.
 * 
 * Features:
 * - Multiple webhook endpoints
 * - Custom payload templates
 * - HTTP Basic Auth and Bearer Token support
 * - Automatic retry on failure
 * - Webhook execution logging
 */

import { prisma } from '../db';

interface WebhookConfig {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  authType?: 'none' | 'basic' | 'bearer';
  username?: string;
  password?: string;
  bearerToken?: string;
  payloadTemplate?: string;
  isActive: boolean;
  retryCount: number;
  timeout: number;
}

interface WebhookPayload {
  lead: any;
  company?: any;
  contact?: any;
  timestamp: string;
  source: string;
  workspaceId: string;
  userId: string;
}

interface WebhookResult {
  success: boolean;
  statusCode?: number;
  response?: any;
  error?: string;
  executionTime: number;
  webhookId: string;
}

/**
 * Get all active webhook configurations for a workspace
 */
export async function getActiveWebhooks(
  userId: string,
  workspaceId: string
): Promise<WebhookConfig[]> {
  try {
    const webhooks = await prisma.webhookConfig.findMany({
      where: {
        userId,
        workspaceId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return webhooks.map((wh) => ({
      id: wh.id,
      url: wh.url,
      method: wh.method as 'POST' | 'PUT' | 'PATCH',
      headers: wh.headers as Record<string, string> | undefined,
      authType: wh.authType as 'none' | 'basic' | 'bearer' | undefined,
      username: wh.username || undefined,
      password: wh.password || undefined,
      bearerToken: wh.bearerToken || undefined,
      payloadTemplate: wh.payloadTemplate || undefined,
      isActive: wh.isActive,
      retryCount: wh.retryCount || 3,
      timeout: wh.timeout || 5000,
    }));
  } catch (error) {
    console.error('Get active webhooks error:', error);
    return [];
  }
}

/**
 * Build payload from template
 */
function buildPayload(
  template: string | undefined,
  data: WebhookPayload
): any {
  if (!template) {
    // Default payload structure
    return {
      lead: {
        id: data.lead?.id,
        email: data.lead?.email,
        firstName: data.lead?.firstName,
        lastName: data.lead?.lastName,
        phone: data.lead?.phone,
        title: data.lead?.title,
        company: data.lead?.company,
        status: data.lead?.status,
        matchScore: data.lead?.matchScore,
      },
      company: data.company,
      contact: data.contact,
      metadata: {
        timestamp: data.timestamp,
        source: data.source,
        workspaceId: data.workspaceId,
        userId: data.userId,
      },
    };
  }

  try {
    // Simple template engine with variable replacement
    let payload = template;
    
    // Replace common variables
    const replacements: Record<string, string> = {
      '{{lead.id}}': data.lead?.id || '',
      '{{lead.email}}': data.lead?.email || '',
      '{{lead.firstName}}': data.lead?.firstName || '',
      '{{lead.lastName}}': data.lead?.lastName || '',
      '{{lead.phone}}': data.lead?.phone || '',
      '{{lead.title}}': data.lead?.title || '',
      '{{lead.company}}': data.lead?.company || '',
      '{{company.name}}': data.company?.name || '',
      '{{company.domain}}': data.company?.domain || '',
      '{{company.website}}': data.company?.website || '',
      '{{company.industry}}': data.company?.industry || '',
      '{{timestamp}}': data.timestamp,
      '{{source}}': data.source,
      '{{workspaceId}}': data.workspaceId,
      '{{userId}}': data.userId,
    };

    for (const [key, value] of Object.entries(replacements)) {
      payload = payload.replace(new RegExp(key, 'g'), value);
    }

    return JSON.parse(payload);
  } catch (error) {
    console.error('Build payload from template error:', error);
    // Fallback to default payload
    return {
      raw_template: template,
      error: 'Failed to parse template',
      data,
    };
  }
}

/**
 * Execute single webhook request
 */
async function executeWebhook(
  config: WebhookConfig,
  payload: any
): Promise<WebhookResult> {
  const startTime = Date.now();
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config.headers || {}),
    };

    // Add authentication headers
    if (config.authType === 'basic' && config.username && config.password) {
      const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    } else if (config.authType === 'bearer' && config.bearerToken) {
      headers['Authorization'] = `Bearer ${config.bearerToken}`;
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000);

    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const executionTime = Date.now() - startTime;
      const statusCode = response.status;

      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }

      if (!response.ok) {
        return {
          success: false,
          statusCode,
          response: responseData,
          error: `HTTP ${statusCode}: ${response.statusText}`,
          executionTime,
          webhookId: config.id,
        };
      }

      return {
        success: true,
        statusCode,
        response: responseData,
        executionTime,
        webhookId: config.id,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime,
      webhookId: config.id,
    };
  }
}

/**
 * Execute webhook with retry logic
 */
async function executeWebhookWithRetry(
  config: WebhookConfig,
  payload: any,
  maxRetries: number = 3
): Promise<WebhookResult> {
  let lastResult: WebhookResult | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    lastResult = await executeWebhook(config, payload);

    if (lastResult.success) {
      return lastResult;
    }

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return lastResult!;
}

/**
 * Send lead data to all configured webhooks
 */
export async function sendLeadToWebhooks(
  lead: any,
  userId: string,
  workspaceId: string
): Promise<WebhookResult[]> {
  try {
    const webhooks = await getActiveWebhooks(userId, workspaceId);

    if (webhooks.length === 0) {
      return [];
    }

    const payload: WebhookPayload = {
      lead,
      timestamp: new Date().toISOString(),
      source: lead.sourceId || 'manual',
      workspaceId,
      userId,
    };

    // Execute all webhooks in parallel
    const results = await Promise.all(
      webhooks.map(async (webhook) => {
        const result = await executeWebhookWithRetry(
          webhook,
          buildPayload(webhook.payloadTemplate, payload),
          webhook.retryCount
        );

        // Log webhook execution
        await logWebhookExecution(result, userId, workspaceId);

        return result;
      })
    );

    return results;
  } catch (error) {
    console.error('Send lead to webhooks error:', error);
    return [];
  }
}

/**
 * Log webhook execution to database
 */
async function logWebhookExecution(
  result: WebhookResult,
  userId: string,
  workspaceId: string
): Promise<void> {
  try {
    await prisma.webhookLog.create({
      data: {
        userId,
        workspaceId,
        webhookId: result.webhookId,
        success: result.success,
        statusCode: result.statusCode,
        response: result.response ? JSON.stringify(result.response) : null,
        error: result.error,
        executionTime: result.executionTime,
      },
    });
  } catch (error) {
    console.error('Log webhook execution error:', error);
  }
}

/**
 * Test webhook configuration
 */
export async function testWebhook(
  webhookId: string,
  userId: string,
  workspaceId: string
): Promise<WebhookResult> {
  try {
    const webhook = await prisma.webhookConfig.findFirst({
      where: {
        id: webhookId,
        userId,
        workspaceId,
      },
    });

    if (!webhook) {
      return {
        success: false,
        error: 'Webhook not found',
        executionTime: 0,
        webhookId: webhookId,
      };
    }

    const config: WebhookConfig = {
      id: webhook.id,
      url: webhook.url,
      method: webhook.method as 'POST' | 'PUT' | 'PATCH',
      headers: webhook.headers as Record<string, string> | undefined,
      authType: webhook.authType as 'none' | 'basic' | 'bearer' | undefined,
      username: webhook.username || undefined,
      password: webhook.password || undefined,
      bearerToken: webhook.bearerToken || undefined,
      payloadTemplate: webhook.payloadTemplate || undefined,
      isActive: webhook.isActive,
      retryCount: 1,
      timeout: 5000,
    };

    // Send test payload
    const testPayload = buildPayload(webhook.payloadTemplate ?? undefined, {
      lead: {
        id: 'test-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      },
      timestamp: new Date().toISOString(),
      source: 'test',
      workspaceId,
      userId,
    });

    const result = await executeWebhook(config, testPayload);

    // Log the test execution
    await logWebhookExecution(result, userId, workspaceId);

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: 0,
      webhookId: webhookId,
    };
  }
}

/**
 * Create webhook configuration
 */
export async function createWebhook(
  data: {
    url: string;
    method: 'POST' | 'PUT' | 'PATCH';
    headers?: Record<string, string>;
    authType?: 'none' | 'basic' | 'bearer';
    username?: string;
    password?: string;
    bearerToken?: string;
    payloadTemplate?: string;
    retryCount?: number;
    timeout?: number;
  },
  userId: string,
  workspaceId: string
): Promise<WebhookConfig | null> {
  try {
    const webhook = await prisma.webhookConfig.create({
      data: {
        userId,
        workspaceId,
        url: data.url,
        method: data.method,
        headers: data.headers,
        authType: data.authType || 'none',
        username: data.username,
        password: data.password,
        bearerToken: data.bearerToken,
        payloadTemplate: data.payloadTemplate,
        isActive: true,
        retryCount: data.retryCount || 3,
        timeout: data.timeout || 5000,
      },
    });

    return {
      id: webhook.id,
      url: webhook.url,
      method: webhook.method as 'POST' | 'PUT' | 'PATCH',
      headers: webhook.headers as Record<string, string> | undefined,
      authType: webhook.authType as 'none' | 'basic' | 'bearer' | undefined,
      username: webhook.username || undefined,
      password: webhook.password || undefined,
      bearerToken: webhook.bearerToken || undefined,
      payloadTemplate: webhook.payloadTemplate || undefined,
      isActive: webhook.isActive,
      retryCount: webhook.retryCount,
      timeout: webhook.timeout,
    };
  } catch (error) {
    console.error('Create webhook error:', error);
    return null;
  }
}

/**
 * Delete webhook configuration
 */
export async function deleteWebhook(
  webhookId: string,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  try {
    const result = await prisma.webhookConfig.deleteMany({
      where: {
        id: webhookId,
        userId,
        workspaceId,
      },
    });

    return result.count > 0;
  } catch (error) {
    console.error('Delete webhook error:', error);
    return false;
  }
}

/**
 * Get webhook execution logs
 */
export async function getWebhookLogs(
  userId: string,
  workspaceId: string,
  limit: number = 100
): Promise<any[]> {
  try {
    const logs = await prisma.webhookLog.findMany({
      where: {
        userId,
        workspaceId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        webhookConfig: {
          select: {
            id: true,
            url: true,
          },
        },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      webhookId: log.webhookId,
      webhookUrl: log.webhookConfig?.url,
      success: log.success,
      statusCode: log.statusCode,
      response: log.response,
      error: log.error,
      executionTime: log.executionTime,
      createdAt: log.createdAt,
    }));
  } catch (error) {
    console.error('Get webhook logs error:', error);
    return [];
  }
}
