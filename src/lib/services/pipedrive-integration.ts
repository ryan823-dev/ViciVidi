/**
 * Pipedrive CRM Integration
 * 
 * Integrates with Pipedrive CRM API v1 to sync leads, persons, and organizations.
 * Supports API key authentication and REST API operations.
 * 
 * Features:
 * - API Key Authentication
 * - Upsert persons by email
 * - Upsert organizations by domain
 * - Associate persons with organizations
 * - Sync leads with full data
 */

import { prisma } from '../db';

interface PipedriveConfig {
  apiToken: string;
  baseUrl: string;
}

interface PipedrivePerson {
  name: string;
  email?: string[];
  phone?: string[];
  title?: string;
  org_id?: number;
  owner_id?: number;
  visible_to?: number;
  custom_fields?: Record<string, any>;
}

interface PipedriveOrganization {
  name: string;
  website?: string;
  address?: string;
  owner_id?: number;
  visible_to?: number;
  custom_fields?: Record<string, any>;
}

interface PipedriveDeal {
  title: string;
  value?: number;
  currency?: string;
  user_id?: number;
  person_id?: number;
  org_id?: number;
  stage_id?: number;
  status?: 'open' | 'won' | 'lost' | 'deleted';
  custom_fields?: Record<string, any>;
}

interface PipedriveLead {
  title: string;
  name?: string;
  email?: string[];
  phone?: string[];
  owner_id?: number;
  is_archived?: boolean;
  custom_fields?: Record<string, any>;
}

interface PipedriveResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  error_message?: string;
}

/**
 * Get Pipedrive API configuration
 */
async function getPipedriveConfig(
  userId: string,
  workspaceId: string
): Promise<PipedriveConfig | null> {
  try {
    const apiKey = await prisma.apiKeyConfig.findFirst({
      where: {
        workspaceId,
        service: 'pipedrive',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!apiKey?.apiKey) {
      console.warn('No Pipedrive API key found');
      return null;
    }

    return {
      apiToken: apiKey.apiKey,
      baseUrl: 'https://api.pipedrive.com/v1',
    };
  } catch (error) {
    console.error('Get Pipedrive config error:', error);
    return null;
  }
}

/**
 * Execute Pipedrive API request
 */
async function executePipedriveRequest<T>(
  config: PipedriveConfig,
  endpoint: string,
  options: RequestInit = {}
): Promise<PipedriveResponse<T> | null> {
  try {
    const url = `${config.baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_token=${config.apiToken}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Pipedrive API error:', error);
      return { success: false, error: response.statusText, error_message: JSON.stringify(error) };
    }

    return await response.json();
  } catch (error) {
    console.error('Pipedrive request error:', error);
    return { success: false, error: 'Network error', error_message: String(error) };
  }
}

/**
 * Find person by email in Pipedrive
 */
async function findPersonByEmail(
  email: string,
  config: PipedriveConfig
): Promise<any | null> {
  try {
    const result = await executePipedriveRequest<{ items: any[] }>(
      config,
      `/persons/find`,
      {
        method: 'GET',
      }
    );

    if (result?.success && result.data) {
      return result.data;
    }

    // Search for person with matching email
    const searchResult = await executePipedriveRequest<{ items: any[] }>(
      config,
      `/persons?email=${encodeURIComponent(email)}`
    );

    if (searchResult?.success && searchResult.data?.items && searchResult.data.items.length > 0) {
      return searchResult.data.items[0];
    }

    return null;
  } catch (error) {
    console.error('Find person by email error:', error);
    return null;
  }
}

/**
 * Find organization by name or website in Pipedrive
 */
async function findOrganizationByNameOrWebsite(
  name: string,
  website?: string,
  config?: PipedriveConfig
): Promise<any | null> {
  if (!config) return null;

  try {
    // Search by name
    const searchResult = await executePipedriveRequest<{ items: any[] }>(
      config,
      `/organizations?term=${encodeURIComponent(name)}`
    );

    if (searchResult?.success && searchResult.data?.items && searchResult.data.items.length > 0) {
      // Check if website matches
      if (website) {
        const matching = searchResult.data.items.find(
          (org: any) => org.website?.includes(website) || website.includes(org.website || '')
        );
        return matching || searchResult.data.items[0];
      }
      return searchResult.data.items[0];
    }

    return null;
  } catch (error) {
    console.error('Find organization error:', error);
    return null;
  }
}

/**
 * Upsert person to Pipedrive
 */
export async function upsertPersonToPipedrive(
  personData: PipedrivePerson,
  userId: string,
  workspaceId: string
): Promise<number | null> {
  try {
    const config = await getPipedriveConfig(userId, workspaceId);
    if (!config) {
      return null;
    }

    // Try to find existing person by email
    let existingPerson: any = null;
    if (personData.email && personData.email.length > 0) {
      existingPerson = await findPersonByEmail(personData.email[0], config);
    }

    if (existingPerson) {
      // Update existing person
      const result = await executePipedriveRequest<{ id: number }>(
        config,
        `/persons/${existingPerson.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(personData),
        }
      );

      return result?.data?.id || null;
    } else {
      // Create new person
      const result = await executePipedriveRequest<{ id: number }>(
        config,
        `/persons`,
        {
          method: 'POST',
          body: JSON.stringify(personData),
        }
      );

      return result?.data?.id || null;
    }
  } catch (error) {
    console.error('Upsert person to Pipedrive error:', error);
    return null;
  }
}

/**
 * Upsert organization to Pipedrive
 */
export async function upsertOrganizationToPipedrive(
  orgData: PipedriveOrganization,
  userId: string,
  workspaceId: string
): Promise<number | null> {
  try {
    const config = await getPipedriveConfig(userId, workspaceId);
    if (!config) {
      return null;
    }

    // Try to find existing organization
    const existingOrg = await findOrganizationByNameOrWebsite(
      orgData.name,
      orgData.website,
      config
    );

    if (existingOrg) {
      // Update existing organization
      const result = await executePipedriveRequest<{ id: number }>(
        config,
        `/organizations/${existingOrg.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(orgData),
        }
      );

      return result?.data?.id || null;
    } else {
      // Create new organization
      const result = await executePipedriveRequest<{ id: number }>(
        config,
        `/organizations`,
        {
          method: 'POST',
          body: JSON.stringify(orgData),
        }
      );

      return result?.data?.id || null;
    }
  } catch (error) {
    console.error('Upsert organization to Pipedrive error:', error);
    return null;
  }
}

/**
 * Associate person with organization in Pipedrive
 */
export async function associatePersonWithOrganization(
  personId: number,
  orgId: number,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  try {
    const config = await getPipedriveConfig(userId, workspaceId);
    if (!config) {
      return false;
    }

    // Update person with org_id
    const result = await executePipedriveRequest(
      config,
      `/persons/${personId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ org_id: orgId }),
      }
    );

    return result?.success === true;
  } catch (error) {
    console.error('Associate person with organization error:', error);
    return false;
  }
}

/**
 * Create deal in Pipedrive
 */
export async function createDealToPipedrive(
  dealData: PipedriveDeal,
  userId: string,
  workspaceId: string
): Promise<number | null> {
  try {
    const config = await getPipedriveConfig(userId, workspaceId);
    if (!config) {
      return null;
    }

    const result = await executePipedriveRequest<{ id: number }>(
      config,
      `/deals`,
      {
        method: 'POST',
        body: JSON.stringify(dealData),
      }
    );

    return result?.data?.id || null;
  } catch (error) {
    console.error('Create deal to Pipedrive error:', error);
    return null;
  }
}

/**
 * Create lead in Pipedrive (Pipedrive Leads API)
 */
export async function createLeadToPipedrive(
  leadData: PipedriveLead,
  userId: string,
  workspaceId: string
): Promise<string | null> {
  try {
    const config = await getPipedriveConfig(userId, workspaceId);
    if (!config) {
      return null;
    }

    const result = await executePipedriveRequest<{ id: string }>(
      config,
      `/leads`,
      {
        method: 'POST',
        body: JSON.stringify(leadData),
      }
    );

    return result?.data?.id || null;
  } catch (error) {
    console.error('Create lead to Pipedrive error:', error);
    return null;
  }
}

/**
 * Sync lead to Pipedrive (high-level function)
 */
export async function syncLeadToPipedrive(
  lead: any,
  userId: string,
  workspaceId: string
): Promise<{ success: boolean; personId?: number; orgId?: number; dealId?: number }> {
  try {
    const config = await getPipedriveConfig(userId, workspaceId);
    if (!config) {
      return { success: false };
    }

    let orgId: number | undefined;
    let personId: number | undefined;

    // 1. Upsert organization
    if (lead.company) {
      const orgData: PipedriveOrganization = {
        name: lead.company.name || lead.company,
        website: lead.company.website,
      };

      orgId = await upsertOrganizationToPipedrive(orgData, userId, workspaceId) || undefined;
    }

    // 2. Upsert person
    if (lead.email || lead.firstName || lead.lastName) {
      const personData: PipedrivePerson = {
        name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.email || 'Unknown',
        email: lead.email ? [lead.email] : [],
        phone: lead.phone ? [lead.phone] : [],
        title: lead.title,
        org_id: orgId,
      };

      personId = await upsertPersonToPipedrive(personData, userId, workspaceId) || undefined;
    }

    // 3. Optionally create deal
    let dealId: number | undefined;
    if (lead.value || lead.dealTitle) {
      const dealData: PipedriveDeal = {
        title: lead.dealTitle || `Deal with ${lead.company?.name || lead.email}`,
        value: lead.value,
        currency: lead.currency || 'USD',
        person_id: personId,
        org_id: orgId,
        status: 'open',
      };

      dealId = await createDealToPipedrive(dealData, userId, workspaceId) || undefined;
    }

    return {
      success: true,
      personId,
      orgId,
      dealId,
    };
  } catch (error) {
    console.error('Sync lead to Pipedrive error:', error);
    return { success: false };
  }
}

/**
 * Get Pipedrive pipelines
 */
export async function getPipedrivePipelines(
  userId: string,
  workspaceId: string
): Promise<any[] | null> {
  try {
    const config = await getPipedriveConfig(userId, workspaceId);
    if (!config) {
      return null;
    }

    const result = await executePipedriveRequest<{ items: any[] }>(
      config,
      `/pipelines`
    );

    return result?.data?.items || null;
  } catch (error) {
    console.error('Get Pipedrive pipelines error:', error);
    return null;
  }
}

/**
 * Get Pipedrive stages
 */
export async function getPipedriveStages(
  pipelineId: number,
  userId: string,
  workspaceId: string
): Promise<any[] | null> {
  try {
    const config = await getPipedriveConfig(userId, workspaceId);
    if (!config) {
      return null;
    }

    const result = await executePipedriveRequest<{ items: any[] }>(
      config,
      `/stages?pipeline_id=${pipelineId}`
    );

    return result?.data?.items || null;
  } catch (error) {
    console.error('Get Pipedrive stages error:', error);
    return null;
  }
}
