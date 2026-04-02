/**
 * 企业背调数据聚合器
 * 整合 Crunchbase、LinkedIn、NewsAPI 数据
 */

import { searchOrganization, extractCrunchbasePermalink, type CrunchbaseOrganization } from './crunchbase';
import { getCompanyByDomain, type LinkedInCompany } from './linkedin';
import { searchCompanyNews, searchFundingNews, type NewsArticle } from './news';

// ==================== 类型定义 ====================

export interface DueDiligenceData {
  // 基本信息
  companyName: string;
  domain?: string;
  generatedAt: string;

  // Crunchbase 数据
  crunchbase?: {
    data: CrunchbaseOrganization | null;
    source: string;
    url: string;
  };

  // LinkedIn 数据
  linkedin?: {
    data: LinkedInCompany | null;
    source: string;
    url: string;
    note?: string; // 如果没有配置 API 的提示
  };

  // 新闻数据
  news?: {
    articles: NewsArticle[];
    totalResults: number;
    source: string;
  };

  // 融资新闻
  funding?: {
    articles: NewsArticle[];
    totalResults: number;
    source: string;
  };

  // 摘要
  summary?: {
    text: string;
    confidence: number; // 0-100
    dataCompleteness: number; // 数据完整度 0-100
  };

  // 数据来源追踪
  sources: string[];
  errors?: string[];
}

/**
 * 从域名提取公司名称
 */
function extractCompanyNameFromDomain(domain: string): string {
  // 移除 www. 和域名后缀
  let name = domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\.(com|org|net|io|co|ai|app)$/i, '')
    .replace(/^m\./, '') // 移动域名
    .split('.')[0];

  // 将连字符替换为空格，并转为标题格式
  name = name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return name;
}

/**
 * 生成 AI 摘要
 */
function generateSummary(data: DueDiligenceData): { text: string; confidence: number; dataCompleteness: number } {
  const sources: string[] = [];
  let confidence = 50; // 基础置信度
  let completeness = 0;

  // Crunchbase 分析
  if (data.crunchbase?.data) {
    sources.push('Crunchbase');
    completeness += 40;
    const cb = data.crunchbase.data.properties;
    if (cb.description) confidence += 15;
    if (cb.num_employees_min) confidence += 10;
    if (cb.total_funding_usd) confidence += 15;
    if (cb.founded_on) confidence += 10;
  }

  // LinkedIn 分析
  if (data.linkedin?.data) {
    sources.push('LinkedIn');
    completeness += 30;
    if (data.linkedin.data.description) confidence += 10;
    if (data.linkedin.data.industries) confidence += 10;
  }

  // 新闻分析
  if (data.news && data.news.totalResults > 0) {
    sources.push('NewsAPI');
    completeness += 20;
    confidence += 10;
  }

  // 融资新闻分析
  if (data.funding && data.funding.totalResults > 0) {
    sources.push('Funding News');
    confidence += 10;
  }

  // 计算数据完整度
  const dataCompleteness = Math.min(100, completeness);
  confidence = Math.min(95, confidence);

  // 生成摘要文本
  let summaryText = '';

  if (data.crunchbase?.data?.properties) {
    const cb = data.crunchbase.data.properties;
    summaryText += `${cb.name || data.companyName} `;

    if (cb.short_description || cb.description) {
      summaryText += `是一家 ${cb.primary_role || '公司'}`;
      if (cb.location_identifiers && cb.location_identifiers.length > 0) {
        summaryText += `，总部位于 ${cb.location_identifiers[0]}`;
      }
    }

    if (cb.num_employees_min && cb.num_employees_max) {
      summaryText += `，员工规模 ${cb.num_employees_min}-${cb.num_employees_max} 人`;
    }

    if (cb.total_funding_usd && cb.total_funding_usd > 0) {
      summaryText += `，累计融资 $${(cb.total_funding_usd / 1000000).toFixed(1)}M`;
    }

    if (cb.founded_on) {
      summaryText += `，成立于 ${cb.founded_on}`;
    }

    if (cb.last_funding_type) {
      summaryText += `，最近一轮融资为 ${cb.last_funding_type}`;
    }

    summaryText += '。';
  }

  if (data.news && data.news.totalResults > 0) {
    summaryText += `近期有 ${data.news.totalResults} 条相关新闻报道。`;
  }

  if (data.funding && data.funding.totalResults > 0) {
    summaryText += '公司近期有融资动态。';
  }

  if (!summaryText) {
    summaryText = `未能获取到 ${data.companyName} 的详细信息。请检查公司名称或域名是否正确。`;
  }

  return {
    text: summaryText.trim(),
    confidence,
    dataCompleteness,
  };
}

/**
 * 聚合企业背调数据
 */
export async function gatherDueDiligence(
  companyName: string,
  domain?: string
): Promise<DueDiligenceData> {
  const result: DueDiligenceData = {
    companyName,
    domain,
    generatedAt: new Date().toISOString(),
    sources: [],
    errors: [],
  };

  // 如果没有提供域名，尝试从公司名提取
  let searchDomain = domain;
  if (!searchDomain && companyName) {
    // 从公司名构建可能的域名
    const possibleDomains = [
      `${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
      `${companyName.toLowerCase().replace(/\s+/g, '-')}.com`,
    ];
    // 使用第一个作为搜索域名
    searchDomain = possibleDomains[0];
  }

  // 并行调用所有数据源
  const [crunchbaseOrg, linkedinCompany, newsArticles, fundingNews] = await Promise.allSettled([
    searchDomain ? searchOrganization(extractCrunchbasePermalink(searchDomain)) : Promise.resolve(null),
    searchDomain ? getCompanyByDomain(searchDomain) : Promise.resolve(null),
    searchCompanyNews(companyName),
    searchFundingNews(companyName),
  ]);

  // 处理 Crunchbase 结果
  if (crunchbaseOrg.status === 'fulfilled' && crunchbaseOrg.value) {
    result.crunchbase = {
      data: crunchbaseOrg.value,
      source: 'Crunchbase API',
      url: `https://www.crunchbase.com/organization/${extractCrunchbasePermalink(searchDomain || companyName)}`,
    };
    result.sources.push('Crunchbase');
  } else if (crunchbaseOrg.status === 'rejected') {
    result.errors?.push(`Crunchbase: ${crunchbaseOrg.reason}`);
  }

  // 处理 LinkedIn 结果
  if (linkedinCompany.status === 'fulfilled') {
    if (linkedinCompany.value) {
      result.linkedin = {
        data: linkedinCompany.value,
        source: 'LinkedIn API',
        url: linkedinCompany.value.linkedinUrl || `https://www.linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')}`,
      };
      result.sources.push('LinkedIn');
    } else {
      // 没有配置 API 或未找到结果
      result.linkedin = {
        data: null,
        source: 'LinkedIn API',
        url: `https://www.linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')}`,
        note: 'LinkedIn API 未配置或未找到匹配公司。LinkedIn 数据需要单独申请 API 访问权限。',
      };
    }
  } else if (linkedinCompany.status === 'rejected') {
    result.errors?.push(`LinkedIn: ${linkedinCompany.reason}`);
  }

  // 处理新闻结果
  if (newsArticles.status === 'fulfilled') {
    result.news = {
      ...newsArticles.value,
      source: 'NewsAPI',
    };
    if (newsArticles.value.totalResults > 0) {
      result.sources.push('NewsAPI');
    }
  } else if (newsArticles.status === 'rejected') {
    result.errors?.push(`NewsAPI: ${newsArticles.reason}`);
  }

  // 处理融资新闻
  if (fundingNews.status === 'fulfilled') {
    result.funding = {
      ...fundingNews.value,
      source: 'NewsAPI',
    };
  }

  // 生成摘要
  result.summary = generateSummary(result);

  return result;
}

/**
 * 获取背调数据来源状态
 */
export function getDueDiligenceStatus(): {
  crunchbase: boolean;
  linkedin: boolean;
  newsapi: boolean;
} {
  return {
    crunchbase: !!process.env.CRUNCHBASE_API_KEY,
    linkedin: !!process.env.LINKEDIN_ACCESS_TOKEN,
    newsapi: !!process.env.NEWS_API_KEY,
  };
}
