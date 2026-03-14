/**
 * Intent Data Tracking Service
 * 
 * Tracks and analyzes buyer intent signals to identify high-intent prospects.
 * Supports IP reverse lookup, page tracking, behavior signals, and intent scoring.
 * 
 * Features:
 * - IP reverse company lookup
 * - Page view tracking
 * - Behavior signal collection
 * - Intent scoring algorithm
 * - Real-time intent alerts
 */

import { prisma } from '../db';

interface IntentSignal {
  workspaceId: string;
  companyId?: string;
  leadId?: string;
  signalType: string;
  intensity: number;
  score: number;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  page?: string;
  referrer?: string;
  occurredAt?: Date;
}

interface IntentScore {
  companyId?: string;
  leadId?: string;
  totalScore: number;
  scoreLevel: 'low' | 'medium' | 'high' | 'critical';
  signalCount: number;
  recentSignals: number; // Last 7 days
  topSignals: Array<{
    type: string;
    score: number;
    occurredAt: Date;
  }>;
  recommendedAction?: string;
}

/**
 * Track intent signal
 */
export async function trackIntentSignal(signal: IntentSignal): Promise<string | null> {
  try {
    const result = await prisma.intentSignal.create({
      data: {
        workspaceId: signal.workspaceId,
        companyId: signal.companyId,
        leadId: signal.leadId,
        signalType: signal.signalType,
        intensity: signal.intensity,
        score: signal.score,
        metadata: signal.metadata ? JSON.stringify(signal.metadata) : undefined,
        ipAddress: signal.ipAddress,
        userAgent: signal.userAgent,
        page: signal.page,
        referrer: signal.referrer,
        occurredAt: signal.occurredAt || new Date(),
      },
    });

    return result.id;
  } catch (error) {
    console.error('Track intent signal error:', error);
    return null;
  }
}

/**
 * IP reverse company lookup
 * Uses IP geolocation and company databases to identify visiting companies
 */
export async function lookupCompanyByIP(
  ipAddress: string,
  workspaceId: string
): Promise<{
  companyName?: string;
  domain?: string;
  confidence: number;
  source: string;
} | null> {
  try {
    // Try local IP database first (free)
    const localLookup = await localIPLookup(ipAddress);
    if (localLookup && localLookup.company) {
      return {
        companyName: localLookup.company,
        domain: localLookup.domain,
        confidence: localLookup.confidence,
        source: 'local_db',
      };
    }

    // Try Clearbit API (if available)
    const clearbitResult = await clearbitIPLookup(ipAddress);
    if (clearbitResult) {
      return clearbitResult;
    }

    // Try Hunter.io domain search
    const hunterResult = await hunterDomainSearch(ipAddress);
    if (hunterResult) {
      return hunterResult;
    }

    return null;
  } catch (error) {
    console.error('IP company lookup error:', error);
    return null;
  }
}

/**
 * Local IP lookup using free database
 */
async function localIPLookup(ipAddress: string): Promise<{
  company?: string;
  domain?: string;
  confidence: number;
} | null> {
  try {
    // Use free IP geolocation API
    const response = await fetch(`http://ip-api.com/json/${ipAddress}`);
    const data = await response.json();

    if (data.status === 'success' && data.isp) {
      return {
        company: data.isp,
        domain: undefined,
        confidence: 0.6, // Lower confidence for ISP data
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Clearbit IP lookup
 */
async function clearbitIPLookup(ipAddress: string): Promise<{
  companyName: string;
  domain: string;
  confidence: number;
  source: string;
} | null> {
  try {
    // This would require Clearbit API key
    // Placeholder for future integration
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Hunter.io domain search by IP
 */
async function hunterDomainSearch(ipAddress: string): Promise<{
  companyName?: string;
  domain?: string;
  confidence: number;
  source: string;
} | null> {
  try {
    // This would require Hunter.io API key
    // Placeholder for future integration
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Track page view with IP lookup
 */
export async function trackPageView(
  data: {
    ipAddress: string;
    userAgent: string;
    page: string;
    referrer?: string;
    duration?: number;
    workspaceId: string;
  }
): Promise<void> {
  try {
    // 1. Lookup company by IP
    const companyLookup = await lookupCompanyByIP(data.ipAddress, data.workspaceId);

    if (companyLookup) {
      // 2. Find matching lead or company
      const matchingLead = await findLeadByDomain(
        companyLookup.domain,
        data.workspaceId
      );

      // 3. Track intent signal
      await trackIntentSignal({
        workspaceId: data.workspaceId,
        companyId: undefined, // Could be resolved from domain
        leadId: matchingLead?.id,
        signalType: 'page_view',
        intensity: 0.3, // Base intensity for page view
        score: 10,
        metadata: {
          duration: data.duration,
          companyName: companyLookup.companyName,
          lookupConfidence: companyLookup.confidence,
          lookupSource: companyLookup.source,
        },
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        page: data.page,
        referrer: data.referrer,
      });
    }
  } catch (error) {
    console.error('Track page view error:', error);
  }
}

/**
 * Track high-intent actions
 */
export async function trackHighIntentAction(
  data: {
    actionType: 'pricing_view' | 'demo_request' | 'contact_form' | 'feature_usage';
    ipAddress?: string;
    workspaceId: string;
    leadId?: string;
    metadata?: any;
  }
): Promise<void> {
  try {
    const signalScores: Record<string, { intensity: number; score: number }> = {
      pricing_view: { intensity: 0.7, score: 30 },
      demo_request: { intensity: 0.9, score: 50 },
      contact_form: { intensity: 0.8, score: 40 },
      feature_usage: { intensity: 0.6, score: 25 },
    };

    const score = signalScores[data.actionType] || { intensity: 0.5, score: 20 };

    await trackIntentSignal({
      workspaceId: data.workspaceId,
      leadId: data.leadId,
      signalType: data.actionType,
      intensity: score.intensity,
      score: score.score,
      metadata: data.metadata,
      ipAddress: data.ipAddress,
    });
  } catch (error) {
    console.error('Track high intent action error:', error);
  }
}

/**
 * Calculate intent score for a company/lead
 */
export async function calculateIntentScore(
  companyId: string | undefined,
  leadId: string | undefined,
  workspaceId: string
): Promise<IntentScore | null> {
  try {
    if (!companyId && !leadId) {
      return null;
    }

    // Get all signals for this entity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const signals = await prisma.intentSignal.findMany({
      where: {
        workspaceId,
        companyId: companyId || null,
        leadId: leadId || null,
        occurredAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        occurredAt: 'desc',
      },
    });

    if (signals.length === 0) {
      return {
        companyId,
        leadId,
        totalScore: 0,
        scoreLevel: 'low',
        signalCount: 0,
        recentSignals: 0,
        topSignals: [],
        recommendedAction: 'Continue nurturing',
      };
    }

    // Calculate weighted score
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let totalScore = 0;
    const topSignals: Array<{ type: string; score: number; occurredAt: Date }> = [];
    let recentSignals = 0;

    for (const signal of signals) {
      // Time decay: more recent signals have higher weight
      const daysSinceSignal =
        (Date.now() - signal.occurredAt.getTime()) / (1000 * 60 * 60 * 24);
      const timeWeight = Math.max(0.5, 1 - daysSinceSignal / 30);

      const weightedScore = Math.round(signal.score * signal.intensity * timeWeight);
      totalScore += weightedScore;

      if (signal.occurredAt >= sevenDaysAgo) {
        recentSignals++;
      }

      topSignals.push({
        type: signal.signalType,
        score: weightedScore,
        occurredAt: signal.occurredAt,
      });
    }

    // Sort and get top 5 signals
    topSignals.sort((a, b) => b.score - a.score);
    const top5Signals = topSignals.slice(0, 5);

    // Determine score level
    let scoreLevel: 'low' | 'medium' | 'high' | 'critical';
    let recommendedAction: string;

    if (totalScore >= 200) {
      scoreLevel = 'critical';
      recommendedAction = 'Immediate outreach required - high buying intent detected';
    } else if (totalScore >= 100) {
      scoreLevel = 'high';
      recommendedAction = 'Priority follow-up within 24 hours';
    } else if (totalScore >= 50) {
      scoreLevel = 'medium';
      recommendedAction = 'Schedule follow-up this week';
    } else {
      scoreLevel = 'low';
      recommendedAction = 'Continue nurturing campaign';
    }

    return {
      companyId,
      leadId,
      totalScore,
      scoreLevel,
      signalCount: signals.length,
      recentSignals,
      topSignals: top5Signals,
      recommendedAction,
    };
  } catch (error) {
    console.error('Calculate intent score error:', error);
    return null;
  }
}

/**
 * Get recent high-intent signals
 */
export async function getRecentHighIntentSignals(
  workspaceId: string,
  limit: number = 20
): Promise<Array<{
  id: string;
  signalType: string;
  intensity: number;
  score: number;
  leadId?: string;
  companyName?: string;
  occurredAt: Date;
  metadata?: any;
}>> {
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const signals = await prisma.intentSignal.findMany({
      where: {
        workspaceId,
        signalType: {
          in: ['pricing_view', 'demo_request', 'contact_form', 'page_view'],
        },
        occurredAt: {
          gte: twentyFourHoursAgo,
        },
      },
      orderBy: [
        { score: 'desc' },
        { occurredAt: 'desc' },
      ],
      take: limit,
      include: {
        lead: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    return signals.map((signal) => ({
      id: signal.id,
      signalType: signal.signalType,
      intensity: signal.intensity,
      score: signal.score,
      leadId: signal.leadId ?? undefined,
      companyName: signal.lead?.companyName ?? undefined,
      occurredAt: signal.occurredAt,
      metadata: signal.metadata ?? undefined,
    }));
  } catch (error) {
    console.error('Get recent high intent signals error:', error);
    return [];
  }
}

/**
 * Find lead by domain
 */
async function findLeadByDomain(
  domain: string | undefined,
  workspaceId: string
): Promise<any | null> {
  if (!domain) {
    return null;
  }

  try {
    return await prisma.lead.findFirst({
      where: {
        workspaceId,
        domain: {
          equals: domain,
          mode: 'insensitive',
        },
      },
    });
  } catch (error) {
    return null;
  }
}

/**
 * Get intent signals timeline
 */
export async function getIntentSignalsTimeline(
  workspaceId: string,
  leadId?: string,
  companyId?: string,
  days: number = 30
): Promise<any[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      workspaceId,
      occurredAt: {
        gte: startDate,
      },
    };

    if (leadId) {
      where.leadId = leadId;
    } else if (companyId) {
      where.companyId = companyId;
    }

    const signals = await prisma.intentSignal.findMany({
      where,
      orderBy: {
        occurredAt: 'desc',
      },
    });

    return signals.map((signal) => ({
      id: signal.id,
      type: signal.signalType,
      score: signal.score,
      intensity: signal.intensity,
      occurredAt: signal.occurredAt,
      page: signal.page,
      metadata: signal.metadata,
    }));
  } catch (error) {
    console.error('Get intent signals timeline error:', error);
    return [];
  }
}

/**
 * Create intent alert (for real-time notifications)
 */
export async function createIntentAlert(
  data: {
    workspaceId: string;
    leadId?: string;
    alertType: 'high_score' | 'demo_request' | 'pricing_view' | 'anomaly';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: data.workspaceId, // Will be resolved later
        type: 'INTENT_ALERT',
        title: data.title,
        message: data.message,
        workspaceId: data.workspaceId,
        data: {
          leadId: data.leadId,
          alertType: data.alertType,
          priority: data.priority,
        },
        read: false,
      },
    });
  } catch (error) {
    console.error('Create intent alert error:', error);
  }
}
