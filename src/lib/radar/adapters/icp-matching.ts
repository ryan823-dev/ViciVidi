/**
 * ICP 向量匹配适配器
 *
 * 基于理想客户画像 (ICP) 找相似潜在客户
 *
 * 工作流程：
 * 1. 用户输入 ICP 描述（如：美国的工业涂装设备制造商，年营收5000万-2亿美元）
 * 2. AI 解析 ICP，提取多维度特征向量
 * 3. 使用 Brave Search 找到相似公司
 * 4. AI 评估匹配度并排序
 */

import type {
  RadarAdapter,
  RadarSearchQuery,
  RadarSearchResult,
  NormalizedCandidate,
  HealthStatus,
  AdapterFeatures,
  AdapterConfig,
} from './types';
import { chatCompletion } from '@/lib/ai-client';

// ==================== ICP 类型定义 ====================

export interface ICPProfile {
  companyType?: string;
  industry?: string[];
  products?: string[];
  targetCountries?: string[];
  companySize?: {
    minEmployees?: number;
    maxEmployees?: number;
    minRevenue?: string;
    maxRevenue?: string;
  };
  techLevel?: 'high' | 'medium' | 'low';
  customerType?: 'B2B' | 'B2C' | 'Both';
  procurement?: {
    formal?: boolean;
    tenderBased?: boolean;
    relationshipBased?: boolean;
  };
  signals?: string[];
}

export interface ICPSearchParams {
  icpDescription: string;
  limit?: number;
  similarityThreshold?: number;
}

interface ICPAnalysis {
  keywords: string[];
  industries: string[];
  countries: string[];
  sizeHint: string;
  b2bSignals: string[];
  procurementPatterns: string[];
  extendedKeywords: string[];
}

// ==================== ICP 向量匹配适配器 ====================

export class ICPMatchingAdapter implements RadarAdapter {
  readonly id = 'icp-matching';
  readonly sourceCode = 'icp_matching';
  readonly name = 'ICP Matching';
  readonly channelType = 'CUSTOM';
  readonly version = '1.0.0';

  private config: AdapterConfig;

  constructor(config: AdapterConfig = {}) {
    this.config = config;
  }

  // ==================== 实现 normalize 方法 ====================

  normalize(raw: unknown): NormalizedCandidate {
    return raw as NormalizedCandidate;
  }

  readonly supportedFeatures: AdapterFeatures = {
    supportsKeywordSearch: true,
    supportsCategoryFilter: false,
    supportsDateFilter: false,
    supportsRegionFilter: true,
    supportsPagination: false,
    supportsDetails: true,
    maxResultsPerQuery: 30,
    rateLimit: { requests: 10, windowMs: 60000 },
  };

  async search(query: RadarSearchQuery): Promise<RadarSearchResult> {
    const startTime = Date.now();
    const icpDescription = query.keywords?.join(' ') || '';

    if (!icpDescription) {
      return {
        items: [],
        total: 0,
        hasMore: false,
        metadata: {
          source: this.id,
          query,
          fetchedAt: new Date(),
          duration: 0,
        },
      };
    }

    // 1. AI 解析 ICP
    const analysis = await this.analyzeICP(icpDescription);

    // 2. 生成搜索查询
    const searchQueries = this.generateSearchQueries(analysis, 20);

    // 3. 执行多源搜索
    const candidates = await this.multiSourceSearch(searchQueries);

    // 4. AI 评估匹配度
    const scoredCandidates = await this.scoreCandidates(candidates, analysis);

    const duration = Date.now() - startTime;

    return {
      items: scoredCandidates,
      total: scoredCandidates.length,
      hasMore: false,
      metadata: {
        source: this.id,
        query,
        fetchedAt: new Date(),
        duration,
      },
    };
  }

  async batchSearch(queries: RadarSearchQuery[]): Promise<RadarSearchResult[]> {
    const results: RadarSearchResult[] = [];
    for (const query of queries) {
      const result = await this.search(query);
      results.push(result);
    }
    return results;
  }

  async realTimeSearch(keyword: string): Promise<RadarSearchResult> {
    return this.search({
      keywords: [keyword],
      countries: [],
    });
  }

  async healthCheck(): Promise<HealthStatus> {
    return {
      healthy: true,
      latency: 0,
      message: 'ICP matching ready',
    };
  }

  // ==================== 私有方法 ====================

  private async analyzeICP(icpDescription: string): Promise<ICPAnalysis> {
    const systemPrompt = `你是一个 B2B 销售专家，负责分析理想客户画像 (ICP)。

分析输入的 ICP 描述，提取以下信息：

1. keywords: 核心关键词列表（产品、行业、技术词）
2. industries: 推断的行业
3. countries: 推断的目标国家/地区
4. sizeHint: 公司规模描述
5. b2bSignals: B2B 相关信号
6. procurementPatterns: 采购模式
7. extendedKeywords: 扩展搜索关键词

输出 JSON 格式：
{
  "keywords": ["工业涂装设备", "painting equipment"],
  "industries": ["制造业", "汽车零部件"],
  "countries": ["美国", "德国"],
  "sizeHint": "年营收5000万-2亿美元，中大型制造商",
  "b2bSignals": ["B2B", "工业客户", "制造商"],
  "procurementPatterns": ["正式采购流程", "招标"],
  "extendedKeywords": ["coating equipment manufacturer"]
}`;

    try {
      const result = await chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: icpDescription },
      ], {
        model: 'qwen-plus',
        temperature: 0.3,
        maxTokens: 1000,
      });

      const parsed = JSON.parse(result.content);
      return {
        keywords: parsed.keywords || [],
        industries: parsed.industries || [],
        countries: parsed.countries || [],
        sizeHint: parsed.sizeHint || '',
        b2bSignals: parsed.b2bSignals || [],
        procurementPatterns: parsed.procurementPatterns || [],
        extendedKeywords: parsed.extendedKeywords || parsed.keywords || [],
      };
    } catch (error) {
      console.error('[ICP] Analysis error:', error);
      return this.fallbackAnalysis(icpDescription);
    }
  }

  private fallbackAnalysis(description: string): ICPAnalysis {
    const words = description.split(/\s+/).filter(w => w.length > 2);
    return {
      keywords: words.slice(0, 10),
      industries: [],
      countries: [],
      sizeHint: '',
      b2bSignals: ['B2B'],
      procurementPatterns: [],
      extendedKeywords: words.slice(0, 10),
    };
  }

  private generateSearchQueries(analysis: ICPAnalysis, limit: number): string[] {
    const queries: string[] = [];
    const allKeywords = [...analysis.keywords, ...analysis.extendedKeywords].slice(0, 10);

    // 产品 + 行业
    for (const keyword of allKeywords.slice(0, 3)) {
      for (const industry of analysis.industries.slice(0, 2)) {
        queries.push(`${keyword} ${industry} manufacturer`);
      }
    }

    // 产品 + 地区
    for (const keyword of allKeywords.slice(0, 3)) {
      for (const country of analysis.countries.slice(0, 3)) {
        queries.push(`${keyword} ${country} industrial`);
      }
    }

    // B2B 信号组合
    for (const signal of analysis.b2bSignals.slice(0, 2)) {
      for (const keyword of allKeywords.slice(0, 2)) {
        queries.push(`${keyword} ${signal}`);
      }
    }

    const uniqueQueries = [...new Set(queries)].slice(0, limit);
    return uniqueQueries.length > 0 ? uniqueQueries : [allKeywords[0] || 'industrial company'];
  }

  private async multiSourceSearch(queries: string[]): Promise<NormalizedCandidate[]> {
    const candidates: NormalizedCandidate[] = [];
    const seen = new Set<string>();

    try {
      const { BraveSearchAdapter } = await import('./brave-search');
      const braveAdapter = new BraveSearchAdapter({} as AdapterConfig);

      for (const query of queries.slice(0, 10)) {
        try {
          const result = await braveAdapter.search({
            keywords: [query],
            countries: [],
          });

          for (const item of result.items || []) {
            if (!seen.has(item.displayName) && item.displayName) {
              seen.add(item.displayName);
              candidates.push({
                externalId: `icp_${Date.now()}_${this.hashString(item.displayName)}`,
                sourceUrl: item.sourceUrl,
                displayName: item.displayName,
                candidateType: 'COMPANY',
                country: item.country,
                matchScore: 0.5,
                matchExplain: {
                  channel: 'icp_matching',
                  reasons: [`匹配: ${query}`],
                },
                description: item.description,
                rawData: { source: 'icp_matching', query },
              });
            }
          }

          await new Promise(r => setTimeout(r, 300));
        } catch (error) {
          console.error('[ICP] Brave search error:', error);
        }
      }
    } catch (error) {
      console.error('[ICP] Multi-source search error:', error);
    }

    return candidates;
  }

  private async scoreCandidates(
    candidates: NormalizedCandidate[],
    analysis: ICPAnalysis
  ): Promise<NormalizedCandidate[]> {
    if (candidates.length === 0) return [];

    const systemPrompt = `评估候选公司与 ICP 的匹配度。

ICP 特征：
- 行业: ${analysis.industries.join(', ') || '未指定'}
- 产品: ${analysis.keywords.join(', ') || '未指定'}
- 地区: ${analysis.countries.join(', ') || '未指定'}

评估标准：
1. 行业匹配度
2. 产品/服务相关性
3. 地区是否在目标市场
4. 是否是制造商（B2B）

输出 JSON 数组：
[{"name": "公司名", "score": 0.85, "reasons": ["匹配原因1"]}]`;

    try {
      const candidateInfo = candidates.slice(0, 10).map(c => ({
        name: c.displayName,
        description: c.description?.slice(0, 200),
        country: c.country,
      }));

      const result = await chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `评估：\n${JSON.stringify(candidateInfo, null, 2)}` },
      ], {
        model: 'qwen-plus',
        temperature: 0.2,
        maxTokens: 1500,
      });

      const scores = JSON.parse(result.content);

      for (const scored of scores) {
        const candidate = candidates.find(c => c.displayName === scored.name);
        if (candidate) {
          candidate.matchScore = scored.score;
          candidate.matchExplain = {
            channel: 'icp_matching',
            reasons: scored.reasons || [],
          };
        }
      }
    } catch (error) {
      console.error('[ICP] Scoring error:', error);
    }

    return candidates.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
