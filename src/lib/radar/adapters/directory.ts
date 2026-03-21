/**
 * 行业名录适配器
 *
 * 发现行业协会会员、采购目录、供应商库
 *
 * 数据来源：
 * 1. 行业协会会员名录
 * 2. 政府采购供应商库
 * 3. B2B 平台企业名录
 * 4. 展会参展商列表
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

// ==================== 类型定义 ====================

export interface DirectorySource {
  id: string;
  name: string;
  type: 'association' | 'government' | 'b2b_platform' | 'trade_show' | 'custom';
  url: string;
  country: string;
  industry?: string;
  description?: string;
}

export interface DirectorySearchParams {
  sourceType?: DirectorySource['type'];
  industry?: string;
  country?: string;
}

// 预配置的权威名录数据源
export const DIRECTORY_SOURCES: DirectorySource[] = [
  // 美国
  {
    id: 'usa-sba',
    name: 'US SBA Business Directory',
    type: 'government',
    url: 'https://www.sba.gov/business-guide/launch-your-business/find-business-name',
    country: 'US',
    description: '美国小企业管理局企业名录',
  },
  {
    id: 'usa-thomasnet',
    name: 'ThomasNet',
    type: 'b2b_platform',
    url: 'https://www.thomasnet.com',
    country: 'US',
    industry: 'Manufacturing',
    description: '北美工业制造商目录',
  },
  // 德国
  {
    id: 'de-hk2',
    name: 'Germany Trade & Invest',
    type: 'association',
    url: 'https://www.gtai.com/en',
    country: 'DE',
    description: '德国贸易投资名录',
  },
  {
    id: 'de-vdma',
    name: 'VDMA - Mechanical Engineering',
    type: 'association',
    url: 'https://www.vdma.org',
    country: 'DE',
    industry: 'Machinery',
    description: '德国机械工程协会',
  },
  // 英国
  {
    id: 'uk-eca',
    name: 'ECA Directory',
    type: 'association',
    url: 'https://www.eca.co.uk',
    country: 'UK',
    industry: 'Electrical',
    description: '英国电气承包商协会',
  },
  // 日本
  {
    id: 'jp-jamea',
    name: 'JAMEA Directory',
    type: 'association',
    url: 'https://www.jamea.or.jp',
    country: 'JP',
    industry: 'Machinery',
    description: '日本工作机械工业会',
  },
  // 中国
  {
    id: 'cn-ccpit',
    name: 'CCPIT',
    type: 'association',
    url: 'https://www.ccpit.org',
    country: 'CN',
    description: '中国国际贸易促进委员会',
  },
  // 印度
  {
    id: 'in-fieo',
    name: 'FIEO',
    type: 'association',
    url: 'https://www.fieo.com',
    country: 'IN',
    description: '印度出口组织联合会',
  },
  // 墨西哥
  {
    id: 'mx-canacintra',
    name: 'CANACINTRA',
    type: 'association',
    url: 'https://www.canacintra.org.mx',
    country: 'MX',
    description: '墨西哥国家工业制造商协会',
  },
  // 越南
  {
    id: 'vn-vnchamber',
    name: 'VCCI',
    type: 'association',
    url: 'https://www.vcci.com.vn',
    country: 'VN',
    description: '越南工商会',
  },
];

// ==================== 行业名录适配器 ====================

export class DirectoryAdapter implements RadarAdapter {
  readonly id = 'directory';
  readonly sourceCode = 'directory';
  readonly name = 'Industry Directory';
  readonly channelType = 'DIRECTORY';
  readonly version = '1.0.0';

  private config: AdapterConfig;
  private sources: DirectorySource[] = DIRECTORY_SOURCES;

  constructor(config: AdapterConfig & { customSources?: DirectorySource[] } = {}) {
    this.config = config;
    // 可以通过配置添加自定义数据源
    if (config.customSources) {
      this.sources = [...this.sources, ...config.customSources];
    }
  }

  readonly supportedFeatures: AdapterFeatures = {
    supportsKeywordSearch: true,
    supportsCategoryFilter: true,
    supportsDateFilter: false,
    supportsRegionFilter: true,
    supportsPagination: true,
    supportsDetails: true,
    maxResultsPerQuery: 50,
    rateLimit: { requests: 20, windowMs: 60000 },
  };

  async search(query: RadarSearchQuery): Promise<RadarSearchResult> {
    const startTime = Date.now();
    const keywords = query.keywords || [];
    const countries = query.countries || [];
    const categories = query.categories || [];

    // 1. 筛选相关数据源
    const relevantSources = this.filterSources(countries, categories);

    // 2. 搜索企业名录
    const entries = await this.searchDirectories(relevantSources, keywords);

    // 3. AI 解析企业信息
    const candidates = await this.parseEntries(entries);

    const duration = Date.now() - startTime;

    return {
      items: candidates,
      total: candidates.length,
      hasMore: false,
      metadata: {
        source: this.sourceCode,
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
      categories: [],
    });
  }

  async healthCheck(): Promise<HealthStatus> {
    const sources = this.sources.filter(s => s.type !== 'custom');
    return {
      healthy: sources.length > 0,
      latency: 0,
      message: `${sources.length} directory sources available`,
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 筛选相关数据源
   */
  private filterSources(countries: string[], categories: string[]): DirectorySource[] {
    return this.sources.filter(source => {
      // 国家筛选
      if (countries.length > 0) {
        const countryMatch = countries.some(
          c => source.country.toLowerCase() === c.toLowerCase()
        );
        if (!countryMatch) return false;
      }
      // 行业筛选
      if (categories.length > 0 && source.industry) {
        const industryMatch = categories.some(
          cat => source.industry?.toLowerCase().includes(cat.toLowerCase())
        );
        if (!industryMatch) return false;
      }
      return true;
    });
  }

  /**
   * 搜索企业名录
   */
  private async searchDirectories(
    sources: DirectorySource[],
    keywords: string[]
  ): Promise<Array<{
    companyName: string;
    source: DirectorySource;
    description?: string;
    url?: string;
  }>> {
    const entries: Array<{
      companyName: string;
      source: DirectorySource;
      description?: string;
      url?: string;
    }> = [];

    for (const source of sources.slice(0, 5)) {
      try {
        // 使用 Brave Search 搜索该名录中的企业
        const { BraveSearchAdapter } = await import('./brave-search');
        const adapter = new BraveSearchAdapter({} as AdapterConfig);

        const searchKeywords = keywords.length > 0
          ? keywords.slice(0, 3)
          : [source.industry || 'company'];

        for (const keyword of searchKeywords) {
          const result = await adapter.search({
            keywords: [`${keyword} site:${new URL(source.url).hostname}`],
            countries: [source.country],
          });

          for (const item of result.items.slice(0, 5)) {
            entries.push({
              companyName: item.displayName,
              source,
              description: item.description,
              url: item.sourceUrl,
            });
          }
        }

        await new Promise(r => setTimeout(r, 500));
      } catch (error) {
        console.error(`[Directory] Error searching ${source.name}:`, error);
      }
    }

    return entries;
  }

  /**
   * AI 解析企业条目
   */
  private async parseEntries(entries: Array<{
    companyName: string;
    source: DirectorySource;
    description?: string;
    url?: string;
  }>): Promise<NormalizedCandidate[]> {
    if (entries.length === 0) return [];

    const systemPrompt = `你是一个 B2B 数据专家。从企业名录条目中提取信息。

分析要点：
1. 公司名称是否完整准确
2. 是否是制造商（B2B）而非个人或零售商
3. 公司规模推断（基于描述）
4. 产品/服务方向

输出 JSON 数组：
[{
  "companyName": "公司名",
  "isManufacturer": true/false,
  "confidence": 0.8,
  "products": ["产品1"],
  "summary": "简短描述"
}]`;

    try {
      const result = await chatCompletion([
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `分析企业名录：\n${JSON.stringify(
            entries.slice(0, 20),
            null,
            2,
          )}`,
        },
      ], {
        model: 'qwen-plus',
        temperature: 0.2,
        maxTokens: 1500,
      });

      const parsed = JSON.parse(result.content);

      return entries.slice(0, parsed.length).map((entry, i) => {
        const info = parsed[i] || {};
        const confidence = info.confidence || 0.6;
        const isManufacturer = info.isManufacturer !== false;

        return {
          externalId: `dir_${Date.now()}_${this.hashString(entry.companyName)}`,
          sourceUrl: entry.url || entry.source.url,
          displayName: entry.companyName,
          candidateType: isManufacturer ? 'COMPANY' : 'OPPORTUNITY',
          country: entry.source.country,
          matchScore: confidence * (isManufacturer ? 1 : 0.5),
          matchExplain: {
            channel: 'directory',
            reasons: [
              `来源: ${entry.source.name}`,
              info.products ? `产品: ${info.products.join(', ')}` : '',
              isManufacturer ? '制造商' : '服务商',
            ].filter(Boolean),
          },
          description: info.summary || entry.description,
          rawData: {
            source: 'directory',
            sourceName: entry.source.name,
            sourceType: entry.source.type,
            products: info.products || [],
          },
        };
      });
    } catch (error) {
      console.error('[Directory] Parse error:', error);
      return entries.map(entry => ({
        externalId: `dir_${Date.now()}_${this.hashString(entry.companyName)}`,
        sourceUrl: entry.url || entry.source.url,
        displayName: entry.companyName,
        candidateType: 'COMPANY' as const,
        country: entry.source.country,
        matchScore: 0.5,
        matchExplain: {
          channel: 'directory',
          reasons: [`来源: ${entry.source.name}`],
        },
        description: entry.description,
      }));
    }
  }

  normalize(raw: unknown): NormalizedCandidate {
    return raw as NormalizedCandidate;
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

// ==================== 辅助函数 ====================

/**
 * 获取特定国家的行业名录
 */
export function getDirectorySourcesByCountry(country: string): DirectorySource[] {
  return DIRECTORY_SOURCES.filter(s => s.country === country);
}

/**
 * 获取特定行业的名录
 */
export function getDirectorySourcesByIndustry(industry: string): DirectorySource[] {
  return DIRECTORY_SOURCES.filter(
    s => s.industry?.toLowerCase().includes(industry.toLowerCase())
  );
}

/**
 * 添加自定义名录数据源
 */
export function createDirectoryAdapter(customSources: DirectorySource[]): DirectoryAdapter {
  return new DirectoryAdapter({
    customSources: customSources as unknown as Record<string, unknown>,
  } as AdapterConfig);
}
