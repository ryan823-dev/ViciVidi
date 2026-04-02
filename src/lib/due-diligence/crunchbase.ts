/**
 * Crunchbase API 集成
 * 用于获取公司组织信息、融资历史等
 */

const CRUNCHBASE_API_KEY = process.env.CRUNCHBASE_API_KEY;

export interface CrunchbaseOrganization {
  identifier: {
    uuid: string;
    name: string;
    permalink: string;
    image_id?: string;
  };
  properties?: {
    name?: string;
    legal_name?: string;
    domain?: string;
    homepage_url?: string;
    linkedin_url?: string;
    twitter_url?: string;
    facebook_url?: string;
    short_description?: string;
    description?: string;
    founded_on?: string;
    closed_on?: string;
    num_employees_min?: number;
    num_employees_max?: number;
    total_funding_usd?: number;
    last_funding_at?: string;
    last_funding_type?: string;
    ipo_shares_outstanding?: number;
    ipo_share_price?: number;
    ipo_date?: string;
    ipo_valiation?: number;
    stock_symbol?: string;
    rank_org?: number;
    phone?: string;
    email?: string;
    location_identifiers?: string[];
    primary_role?: string;
    revenue_range?: string;
    status?: string;
  };
  relationships?: {
    funding_rounds?: {
      items: CrunchbaseFundingRound[];
      count: number;
    };
    investors?: {
      items: CrunchbaseInvestor[];
      count: number;
    };
    founders?: {
      items: CrunchbasePerson[];
      count: number;
    };
    products?: {
      items: CrunchbaseProduct[];
      count: number;
    };
    news?: {
      items: CrunchbaseNews[];
      count: number;
    };
  };
}

export interface CrunchbaseFundingRound {
  identifier: {
    uuid: string;
    name: string;
    permalink: string;
  };
  properties: {
    funding_type: string;
    announced_on: string;
    money_raised_usd: number;
    post_money_valuation?: number;
    pre_money_valuation?: number;
    lead_investor?: boolean;
  };
}

export interface CrunchbaseInvestor {
  identifier: {
    uuid: string;
    name: string;
    permalink: string;
    image_id?: string;
  };
  properties: {
    type: string;
    num_investments: number;
  };
}

export interface CrunchbasePerson {
  identifier: {
    uuid: string;
    name: string;
    permalink: string;
  };
  properties: {
    title?: string;
    organization?: string;
  };
}

export interface CrunchbaseProduct {
  identifier: {
    uuid: string;
    name: string;
    permalink: string;
  };
  properties: {
    description?: string;
  };
}

export interface CrunchbaseNews {
  identifier: {
    uuid: string;
    title: string;
    url: string;
  };
  properties: {
    posted_on: string;
    author?: string;
    author_url?: string;
    publisher?: string;
    publisher_url?: string;
  };
}

/**
 * 搜索组织（公司）
 */
export async function searchOrganization(
  identifier: string,
  options: {
    field_ids?: string[];
  } = {}
): Promise<CrunchbaseOrganization | null> {
  if (!CRUNCHBASE_API_KEY) {
    console.warn('[Crunchbase] API key not configured');
    return null;
  }

  try {
    const url = `https://api.crunchbase.com/api/v4/entities/organizations/${identifier}`;

    const params = new URLSearchParams({
      user_key: CRUNCHBASE_API_KEY,
    });

    if (options.field_ids && options.field_ids.length > 0) {
      params.set('field_ids', options.field_ids.join(','));
    }

    const response = await fetch(`${url}?${params.toString()}`, {
      headers: {
        'User-Agent': 'ViciVidi/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[Crunchbase] Organization not found: ${identifier}`);
        return null;
      }
      console.error(`[Crunchbase] API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Crunchbase] Fetch error:', error);
    return null;
  }
}

/**
 * 获取组织完整信息
 */
export async function getOrganizationFull(
  identifier: string
): Promise<CrunchbaseOrganization | null> {
  if (!CRUNCHBASE_API_KEY) {
    return null;
  }

  try {
    const url = `https://api.crunchbase.com/api/v4/entities/organizations/${identifier}`;

    const params = new URLSearchParams({
      user_key: CRUNCHBASE_API_KEY,
      field_ids: [
        'identifier',
        'name',
        'legal_name',
        'domain',
        'homepage_url',
        'linkedin_url',
        'twitter_url',
        'facebook_url',
        'short_description',
        'description',
        'founded_on',
        'closed_on',
        'num_employees_min',
        'num_employees_max',
        'total_funding_usd',
        'last_funding_at',
        'last_funding_type',
        'ipo_date',
        'stock_symbol',
        'rank_org',
        'phone',
        'email',
        'location_identifiers',
        'primary_role',
        'revenue_range',
        'status',
      ].join(','),
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      headers: {
        'User-Agent': 'ViciVidi/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[Crunchbase] Full fetch error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Crunchbase] Full fetch error:', error);
    return null;
  }
}

/**
 * 从域名提取 Crunchbase permalink
 * 注意: 这是一个简化实现，实际可能需要额外的数据处理
 */
export function extractCrunchbasePermalink(domain: string): string {
  // 移除 www. 和协议
  let cleanDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');

  // 替换点为连字符
  return cleanDomain.replace(/\./g, '-');
}
