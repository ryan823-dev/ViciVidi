/**
 * LinkedIn API 集成
 * 注意: LinkedIn 对 API 访问有严格限制
 * 需要 LinkedIn API 访问权限和应用认证
 *
 * 替代方案: 使用 Apollo.io 或其他数据服务获取 LinkedIn 信息
 */

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;

export interface LinkedInCompany {
  id: string;
  name: string;
  universalName: string;
  domain: string;
  logoUrl?: string;
  websiteUrl?: string;
  industries?: string[];
  headquarters?: {
    city?: string;
    country?: string;
    state?: string;
  };
  foundedOn?: string;
  endDate?: string;
  companyType?: string;
  description?: string;
  employeeCountRange?: string;
  specialities?: string[];
  linkedinUrl?: string;
}

export interface LinkedInOrganizationMatch {
  query: string;
  totalResults: number;
  organizations: LinkedInCompany[];
}

/**
 * 通过域名搜索公司
 * 需要 LinkedIn Organization API 访问权限
 */
export async function getCompanyByDomain(
  domain: string
): Promise<LinkedInCompany | null> {
  // 如果没有配置 LinkedIn API，返回模拟数据提示用户
  if (!LINKEDIN_ACCESS_TOKEN) {
    console.warn('[LinkedIn] No access token configured');
    return null;
  }

  try {
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    const response = await fetch(
      `https://api.linkedin.com/v2/organizations?q=domain&domain=${encodeURIComponent(cleanDomain)}`,
      {
        headers: {
          'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
          'Accept': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    if (!response.ok) {
      console.error(`[LinkedIn] API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.elements && data.elements.length > 0) {
      const org = data.elements[0];
      return {
        id: org.id,
        name: org.name,
        universalName: org.universalName,
        domain: cleanDomain,
        logoUrl: org.logoV2?.original,
        websiteUrl: org.websiteUrl,
        industries: org.industries,
        headquarters: {
          city: org.headquarter?.city,
          country: org.headquarter?.country,
          state: org.headquarter?.state,
        },
        foundedOn: org.foundedOn,
        endDate: org.endDate,
        companyType: org.companyType,
        description: org.description,
        employeeCountRange: org.employeeCountRange,
        specialities: org.specialities,
        linkedinUrl: `https://www.linkedin.com/company/${org.universalName}`,
      };
    }

    return null;
  } catch (error) {
    console.error('[LinkedIn] Fetch error:', error);
    return null;
  }
}

/**
 * 搜索组织
 * 需要 LinkedIn Organization Search API 权限
 */
export async function searchOrganizations(
  query: string,
  options: {
    limit?: number;
  } = {}
): Promise<LinkedInOrganizationMatch> {
  const { limit = 5 } = options;

  if (!LINKEDIN_ACCESS_TOKEN) {
    console.warn('[LinkedIn] No access token configured');
    return {
      query,
      totalResults: 0,
      organizations: [],
    };
  }

  try {
    const response = await fetch(
      `https://api.linkedin.com/v2/organizationSearch?q=search&search.keywords=${encodeURIComponent(query)}&count=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
          'Accept': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    if (!response.ok) {
      console.error(`[LinkedIn] Search error: ${response.status}`);
      return {
        query,
        totalResults: 0,
        organizations: [],
      };
    }

    const data = await response.json();

    const organizations: LinkedInCompany[] = (data.elements || []).map((org: any) => ({
      id: org.id,
      name: org.name,
      universalName: org.universalName,
      domain: org.domain,
      logoUrl: org.logoV2?.original,
      websiteUrl: org.websiteUrl,
      industries: org.industries,
      headquarters: {
        city: org.headquarter?.city,
        country: org.headquarter?.country,
        state: org.headquarter?.state,
      },
      foundedOn: org.foundedOn,
      description: org.description,
      employeeCountRange: org.employeeCountRange,
      specialities: org.specialities,
      linkedinUrl: `https://www.linkedin.com/company/${org.universalName}`,
    }));

    return {
      query,
      totalResults: data.total || organizations.length,
      organizations,
    };
  } catch (error) {
    console.error('[LinkedIn] Search error:', error);
    return {
      query,
      totalResults: 0,
      organizations: [],
    };
  }
}
