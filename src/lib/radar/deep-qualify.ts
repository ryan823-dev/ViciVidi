/**
 * AI 深度评估模块
 *
 * Stage 2：对通过规则快筛的候选进行基于 CompanyProfile + ICP 的深度匹配。
 * 使用 LLM 判断"这个客户到底适不适合我们"，而不是简单的关键词匹配。
 *
 * 可被 cron (radar-qualify) 和手动操作两种场景调用。
 */

import { prisma } from '@/lib/prisma';
import { chatCompletion } from '@/lib/ai-client';
import type { CompanyProfileContext } from '@/lib/skills/types';

// ==================== 类型定义 ====================

export interface DeepQualifyCandidate {
  id: string;
  displayName: string;
  website?: string | null;
  description?: string | null;
  industry?: string | null;
  country?: string | null;
  city?: string | null;
  companySize?: string | null;
  sourceUrl: string;
  sourceChannel?: string;
  matchExplain?: Record<string, unknown> | null;
}

export interface DeepQualifyResult {
  id: string;
  tier: 'A' | 'B' | 'C' | 'excluded';
  confidence: number;
  matchReasons: string[];
  approachAngle: string;
  exclusionReason: string | null;
  dataGaps: string[];
}

export interface DeepQualifyBatchResult {
  results: DeepQualifyResult[];
  tokensUsed: number;
  duration: number;
  errors: string[];
}

// ==================== CompanyProfile 加载 ====================

const profileCache = new Map<string, { data: CompanyProfileContext; expiresAt: number }>();

async function loadCompanyProfile(tenantId: string): Promise<CompanyProfileContext | null> {
  const cached = profileCache.get(tenantId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const profile = await prisma.companyProfile.findUnique({
    where: { tenantId },
  });

  if (!profile) return null;

  const ctx: CompanyProfileContext = {
    companyName: profile.companyName || '',
    companyIntro: profile.companyIntro || '',
    coreProducts: (profile.coreProducts as Array<{ name: string; description: string }>) || [],
    techAdvantages: (profile.techAdvantages as Array<{ title: string; description: string }>) || [],
    scenarios: (profile.scenarios as Array<{ industry: string; scenario: string }>) || [],
    differentiators: (profile.differentiators as Array<{ point: string; description: string }>) || [],
    targetIndustries: (profile.targetIndustries as string[]) || [],
    targetRegions: (profile.targetRegions as string[]) || [],
    buyerPersonas: (profile.buyerPersonas as Array<{ role: string; title: string; concerns: string[] }>) || [],
    painPoints: (profile.painPoints as Array<{ pain: string; howWeHelp: string }>) || [],
    buyingTriggers: (profile.buyingTriggers as string[]) || [],
  };

  profileCache.set(tenantId, { data: ctx, expiresAt: Date.now() + 10 * 60 * 1000 });
  return ctx;
}

// ==================== Prompt 构建 ====================

function buildCompanyContext(profile: CompanyProfileContext): string {
  const sections: string[] = [];

  sections.push(`公司名称：${profile.companyName}`);
  sections.push(`公司简介：${profile.companyIntro}`);

  if (profile.coreProducts.length > 0) {
    sections.push('\n核心产品/服务：');
    profile.coreProducts.forEach((p, i) => {
      sections.push(`${i + 1}. ${p.name}：${p.description}`);
    });
  }

  if (profile.techAdvantages.length > 0) {
    sections.push('\n技术优势：');
    profile.techAdvantages.forEach((t, i) => {
      sections.push(`${i + 1}. ${t.title}：${t.description}`);
    });
  }

  if (profile.scenarios.length > 0) {
    sections.push('\n适用场景：');
    profile.scenarios.forEach((s, i) => {
      sections.push(`${i + 1}. ${s.industry} - ${s.scenario}`);
    });
  }

  if (profile.differentiators.length > 0) {
    sections.push('\n差异化卖点：');
    profile.differentiators.forEach((d, i) => {
      sections.push(`${i + 1}. ${d.point}：${d.description}`);
    });
  }

  if (profile.targetIndustries.length > 0) {
    sections.push(`\n目标行业：${profile.targetIndustries.join('、')}`);
  }
  if (profile.targetRegions.length > 0) {
    sections.push(`目标地区：${profile.targetRegions.join('、')}`);
  }

  if (profile.painPoints.length > 0) {
    sections.push('\n客户痛点：');
    profile.painPoints.forEach((p, i) => {
      sections.push(`${i + 1}. ${p.pain} → ${p.howWeHelp}`);
    });
  }

  if (profile.buyingTriggers.length > 0) {
    sections.push(`\n采购触发因素：${profile.buyingTriggers.join('、')}`);
  }

  return sections.join('\n');
}

function buildCandidatesList(candidates: DeepQualifyCandidate[]): string {
  return candidates.map((c, i) => {
    const parts = [`${i + 1}. [ID: ${c.id}] ${c.displayName}`];
    if (c.website) parts.push(`   网站: ${c.website}`);
    if (c.description) parts.push(`   描述: ${c.description.slice(0, 300)}`);
    if (c.industry) parts.push(`   行业: ${c.industry}`);
    if (c.country) parts.push(`   国家: ${c.country}${c.city ? ` / ${c.city}` : ''}`);
    if (c.companySize) parts.push(`   规模: ${c.companySize}`);
    if (c.sourceChannel) parts.push(`   来源: ${c.sourceChannel}`);
    return parts.join('\n');
  }).join('\n\n');
}

const SYSTEM_PROMPT = `你是一名专业的B2B出海获客分析师。你的任务是判断候选公司是否真正需要"我方企业"的产品或服务。

## 核心判断逻辑

不要做简单的关键词匹配。你需要基于以下维度进行深度分析：

1. **需求匹配度**：该公司的业务是否会产生对我方产品的实际需求？
   - 它的生产流程/业务流程中是否有使用我方产品的环节？
   - 它所在的行业是否是我方的目标应用场景？

2. **采购能力**：该公司的规模和类型是否意味着它有采购我方产品的能力？
   - 是终端用户（直接使用者）还是中间商/经销商？
   - 终端用户优先级更高

3. **地理适配**：该公司所在的国家/地区是否属于我方的目标市场？

4. **时机信号**：是否有迹象表明该公司近期有采购意向？
   - 正在扩产、新建工厂、发布招标、招聘相关岗位等

## 分层标准

- **Tier A（优质客户）**：需求明确匹配 + 规模合适 + 地区匹配，值得立即跟进
- **Tier B（潜力客户）**：需求可能匹配但不确定，或规模/地区部分匹配，值得进一步了解
- **Tier C（一般客户）**：间接关联，匹配度低但不排除
- **excluded（排除）**：明确不是目标客户（竞争对手、中间商、行业无关）

## 接触角度（approachAngle）

为每个 Tier A/B 的候选提供一个具体的接触切入点。对 Tier C 和 excluded 可留空字符串。

## 输出要求

严格输出以下 JSON 格式，不要包含任何其他文字：

{
  "results": [
    {
      "id": "候选ID",
      "tier": "A|B|C|excluded",
      "confidence": 0.85,
      "matchReasons": ["具体原因1", "具体原因2"],
      "approachAngle": "推荐的接触切入点",
      "exclusionReason": null,
      "dataGaps": ["需要补全的信息"]
    }
  ],
  "batchSummary": { "total": 10, "tierA": 2, "tierB": 3, "tierC": 3, "excluded": 2 }
}`;

// ==================== 核心评估函数 ====================

/**
 * 对一批候选进行 AI 深度评估
 *
 * @param tenantId - 租户 ID
 * @param candidates - 通过 Stage 1 快筛的候选列表（建议 ≤ 10 个/批）
 */
export async function deepQualifyBatch(
  tenantId: string,
  candidates: DeepQualifyCandidate[],
): Promise<DeepQualifyBatchResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  if (candidates.length === 0) {
    return { results: [], tokensUsed: 0, duration: 0, errors: [] };
  }

  // 加载企业画像
  const companyProfile = await loadCompanyProfile(tenantId);

  const companyContext = companyProfile
    ? buildCompanyContext(companyProfile)
    : '（未配置企业画像。请基于候选公司自身信息和通用B2B逻辑进行判断。）';

  const candidatesList = buildCandidatesList(candidates);

  const userPrompt = `
=== 我方企业画像 ===
${companyContext}

=== 待评估的候选公司（共${candidates.length}家） ===
${candidatesList}

请对以上每个候选公司进行深度匹配评估。`;

  try {
    const aiResponse = await chatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      {
        model: 'qwen-plus',
        temperature: 0.2,
        maxTokens: 4096,
      },
    );

    // 解析 AI 输出
    let cleaned = aiResponse.content.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();

    let parsed: { results?: DeepQualifyResult[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      errors.push(`JSON parse failed: ${cleaned.slice(0, 200)}`);
      return {
        results: candidates.map(c => ({
          id: c.id,
          tier: 'C' as const,
          confidence: 0,
          matchReasons: ['AI 解析失败，降级为 C'],
          approachAngle: '',
          exclusionReason: null,
          dataGaps: [],
        })),
        tokensUsed: aiResponse.usage.totalTokens,
        duration: Date.now() - startTime,
        errors,
      };
    }

    // 校验并补全缺失的候选结果
    const resultMap = new Map<string, DeepQualifyResult>();
    if (parsed.results && Array.isArray(parsed.results)) {
      for (const r of parsed.results) {
        if (r.id) resultMap.set(r.id, r);
      }
    }

    const finalResults: DeepQualifyResult[] = candidates.map(c => {
      const aiResult = resultMap.get(c.id);
      if (aiResult) {
        return {
          id: c.id,
          tier: (['A', 'B', 'C', 'excluded'].includes(aiResult.tier) ? aiResult.tier : 'C') as 'A' | 'B' | 'C' | 'excluded',
          confidence: typeof aiResult.confidence === 'number' ? Math.min(1, Math.max(0, aiResult.confidence)) : 0.5,
          matchReasons: Array.isArray(aiResult.matchReasons) ? aiResult.matchReasons : [],
          approachAngle: typeof aiResult.approachAngle === 'string' ? aiResult.approachAngle : '',
          exclusionReason: aiResult.exclusionReason ?? null,
          dataGaps: Array.isArray(aiResult.dataGaps) ? aiResult.dataGaps : [],
        };
      }

      errors.push(`AI did not return result for candidate ${c.id} (${c.displayName})`);
      return {
        id: c.id,
        tier: 'C' as const,
        confidence: 0,
        matchReasons: ['AI 未返回结果，降级为 C'],
        approachAngle: '',
        exclusionReason: null,
        dataGaps: [],
      };
    });

    return {
      results: finalResults,
      tokensUsed: aiResponse.usage.totalTokens,
      duration: Date.now() - startTime,
      errors,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown AI error';
    errors.push(errMsg);

    // AI 调用失败时全部降级为 C，不阻塞流程
    return {
      results: candidates.map(c => ({
        id: c.id,
        tier: 'C' as const,
        confidence: 0,
        matchReasons: [`AI 调用失败 (${errMsg})，降级为 C`],
        approachAngle: '',
        exclusionReason: null,
        dataGaps: [],
      })),
      tokensUsed: 0,
      duration: Date.now() - startTime,
      errors,
    };
  }
}

// ==================== 数据库更新 ====================

/**
 * 将深度评估结果写回数据库
 */
export async function applyDeepQualifyResults(
  results: DeepQualifyResult[],
  profileId: string,
): Promise<{ updated: number; excluded: number; errors: string[] }> {
  let updated = 0;
  let excluded = 0;
  const errors: string[] = [];

  for (const result of results) {
    try {
      if (result.tier === 'excluded') {
        await prisma.radarCandidate.update({
          where: { id: result.id },
          data: {
            status: 'EXCLUDED',
            qualifyTier: 'excluded',
            qualifyReason: result.exclusionReason || 'AI deep-qualify: excluded',
            matchScore: result.confidence,
            aiRelevance: {
              tier: result.tier,
              confidence: result.confidence,
              matchReasons: result.matchReasons,
              approachAngle: result.approachAngle,
              source: 'deep-qualify-v2',
            } as object,
            qualifiedAt: new Date(),
            qualifiedBy: 'ai-deep-qualify',
          },
        });
        excluded++;

        // Feedback Loop: 记录排除
        await appendExclusionFeedback(profileId, result);
      } else {
        // 判断是否需要 enrich
        const candidate = await prisma.radarCandidate.findUnique({
          where: { id: result.id },
          select: { website: true, phone: true, email: true, sourceId: true },
        });

        const needsEnrich = candidate && !candidate.website && !candidate.phone && !candidate.email;
        const finalStatus = (needsEnrich && (result.tier === 'A' || result.tier === 'B'))
          ? 'ENRICHING'
          : 'QUALIFIED';

        await prisma.radarCandidate.update({
          where: { id: result.id },
          data: {
            status: finalStatus,
            qualifyTier: result.tier,
            qualifyReason: result.matchReasons.join('; '),
            matchScore: result.confidence,
            aiSummary: result.approachAngle || null,
            aiRelevance: {
              tier: result.tier,
              confidence: result.confidence,
              matchReasons: result.matchReasons,
              approachAngle: result.approachAngle,
              dataGaps: result.dataGaps,
              source: 'deep-qualify-v2',
            } as object,
            qualifiedAt: new Date(),
            qualifiedBy: 'ai-deep-qualify',
          },
        });
        updated++;
      }
    } catch (error) {
      errors.push(`Update ${result.id}: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  return { updated, excluded, errors };
}

// ==================== Feedback Loop ====================

async function appendExclusionFeedback(
  profileId: string,
  result: DeepQualifyResult,
): Promise<void> {
  try {
    const profile = await prisma.radarSearchProfile.findUnique({
      where: { id: profileId },
      select: { exclusionRules: true },
    });

    const rules = (profile?.exclusionRules as {
      excludedCompanies?: string[];
      excludedPatterns?: string[];
    }) || {};

    const excludedCompanies = rules.excludedCompanies || [];
    const MAX_EXCLUSIONS = 200;
    if (excludedCompanies.length >= MAX_EXCLUSIONS) return;

    // 提取排除原因中的模式（如果有明确的行业排除原因）
    const candidateName = result.matchReasons.find(r => r.includes('竞争对手'))
      ? undefined
      : undefined;

    // 目前只做公司名排除，避免过度排除
    await prisma.radarSearchProfile.update({
      where: { id: profileId },
      data: {
        exclusionRules: {
          ...rules,
          excludedCompanies: [...new Set(excludedCompanies)].slice(0, MAX_EXCLUSIONS),
        } as object,
      },
    });
  } catch {
    // 静默失败，不影响主流程
  }
}
