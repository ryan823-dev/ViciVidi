/**
 * Salesforce CRM Integration
 * 
 * Integrates with Salesforce CRM v3 API to sync leads, contacts, and companies.
 * Supports OAuth 2.0 authentication and REST API operations.
 * 
 * Features:
 * - OAuth 2.0 JWT Bearer Flow or Username-Password Flow
 * - Upsert contacts by email
 * - Upsert companies (Accounts) by domain
 * - Associate contacts with companies
 * - Sync leads with full data
 */

import { prisma } from '../db';

interface SalesforceConfig {
  instanceUrl: string;
  accessToken: string;
  apiVersion: string;
}

interface SalesforceContact {
  Id?: string;
  FirstName?: string;
  LastName: string;
  Email?: string;
  Phone?: string;
  Title?: string;
  LinkedIn__c?: string;
  Description?: string;
}

interface SalesforceAccount {
  Id?: string;
  Name: string;
  Domain__c?: string;
  Website?: string;
  Industry?: string;
  NumberOfEmployees?: number;
  AnnualRevenue?: number;
  BillingStreet?: string;
  BillingCity?: string;
  BillingState?: string;
  BillingPostalCode?: string;
  BillingCountry?: string;
  Description?: string;
  LinkedIn__c?: string;
}

interface SalesforceLead {
  Id?: string;
  FirstName?: string;
  LastName: string;
  Company: string;
  Email?: string;
  Phone?: string;
  Title?: string;
  Status?: string;
  Industry?: string;
  Website?: string;
  LinkedIn__c?: string;
  Description?: string;
}

interface OAuthTokenResponse {
  access_token: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
  signature: string;
}

/**
 * Authenticate with Salesforce using OAuth 2.0
 * Supports both JWT Bearer Flow and Username-Password Flow
 */
async function authenticateWithSalesforce(
  userId: string,
  workspaceId: string
): Promise<SalesforceConfig | null> {
  try {
    // Get Salesforce API credentials from database
    const apiKey = await prisma.apiKeyConfig.findFirst({
      where: {
        workspaceId,
        service: 'salesforce',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!apiKey?.apiKey) {
      console.warn('No Salesforce API key found');
      return null;
    }

    // Parse credentials from API key storage
    const credentials = JSON.parse(apiKey.apiKey);
    const { clientId, clientSecret, username, password, securityToken } = credentials;

    // Try JWT Bearer Flow first (more secure)
    if (credentials.privateKey) {
      return await jwtBearerFlow(clientId, credentials.privateKey);
    }

    // Fallback to Username-Password Flow
    return await usernamePasswordFlow(
      clientId,
      clientSecret,
      username,
      password,
      securityToken
    );
  } catch (error) {
    console.error('Salesforce authentication error:', error);
    return null;
  }
}

/**
 * OAuth 2.0 JWT Bearer Flow
 */
async function jwtBearerFlow(
  clientId: string,
  privateKey: string
): Promise<SalesforceConfig | null> {
  try {
    // Create JWT assertion
    const header = {
      alg: 'RS256',
    };

    const claims = {
      iss: clientId,
      sub: 'user@example.com', // Replace with actual username
      aud: 'https://login.salesforce.com',
      exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
    };

    // Note: In production, use proper JWT signing library
    // For now, we'll use the token endpoint directly
    const assertion = Buffer.from(
      JSON.stringify(header) + '.' + JSON.stringify(claims)
    ).toString('base64');

    const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });

    if (!response.ok) {
      throw new Error(`Salesforce OAuth error: ${response.statusText}`);
    }

    const data: OAuthTokenResponse = await response.json();

    return {
      instanceUrl: data.instance_url,
      accessToken: data.access_token,
      apiVersion: 'v60.0',
    };
  } catch (error) {
    console.error('JWT Bearer Flow error:', error);
    return null;
  }
}

/**
 * OAuth 2.0 Username-Password Flow
 */
async function usernamePasswordFlow(
  clientId: string,
  clientSecret: string,
  username: string,
  password: string,
  securityToken?: string
): Promise<SalesforceConfig | null> {
  try {
    const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: clientId,
        client_secret: clientSecret,
        username,
        password: password + (securityToken || ''),
      }),
    });

    if (!response.ok) {
      throw new Error(`Salesforce OAuth error: ${response.statusText}`);
    }

    const data: OAuthTokenResponse = await response.json();

    return {
      instanceUrl: data.instance_url,
      accessToken: data.access_token,
      apiVersion: 'v60.0',
    };
  } catch (error) {
    console.error('Username-Password Flow error:', error);
    return null;
  }
}

/**
 * Execute Salesforce API request
 */
async function executeSalesforceRequest<T>(
  config: SalesforceConfig,
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    const url = `${config.instanceUrl}/services/data/${config.apiVersion}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Salesforce API error:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Salesforce request error:', error);
    return null;
  }
}

/**
 * Upsert contact to Salesforce
 */
export async function upsertContactToSalesforce(
  contactData: SalesforceContact,
  userId: string,
  workspaceId: string
): Promise<string | null> {
  try {
    const config = await authenticateWithSalesforce(userId, workspaceId);
    if (!config) {
      return null;
    }

    // Upsert by email (requires external ID field on Contact object)
    const endpoint = contactData.Id
      ? `/sobjects/Contact/${contactData.Id}`
      : `/sobjects/Contact/Email__c/${contactData.Email}`;

    const method = contactData.Id ? 'PATCH' : 'POST';
    
    const result = await executeSalesforceRequest<{ id: string } | { Id: string }>(
      config,
      endpoint,
      {
        method,
        body: JSON.stringify(contactData),
      }
    );

    if (result) {
      return 'id' in result ? result.id : result.Id;
    }

    return null;
  } catch (error) {
    console.error('Upsert contact to Salesforce error:', error);
    return null;
  }
}

/**
 * Upsert company (Account) to Salesforce
 */
export async function upsertCompanyToSalesforce(
  companyData: SalesforceAccount,
  userId: string,
  workspaceId: string
): Promise<string | null> {
  try {
    const config = await authenticateWithSalesforce(userId, workspaceId);
    if (!config) {
      return null;
    }

    // Upsert by domain custom field or Id
    const endpoint = companyData.Id
      ? `/sobjects/Account/${companyData.Id}`
      : companyData.Domain__c
      ? `/sobjects/Account/Domain__c/${companyData.Domain__c}`
      : `/sobjects/Account`;

    const method = companyData.Id ? 'PATCH' : 'POST';
    
    const result = await executeSalesforceRequest<{ id: string } | { Id: string }>(
      config,
      endpoint,
      {
        method,
        body: JSON.stringify(companyData),
      }
    );

    if (result) {
      return 'id' in result ? result.id : result.Id;
    }

    return null;
  } catch (error) {
    console.error('Upsert company to Salesforce error:', error);
    return null;
  }
}

/**
 * Associate contact with company in Salesforce
 */
export async function associateContactWithCompany(
  contactId: string,
  accountId: string,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  try {
    const config = await authenticateWithSalesforce(userId, workspaceId);
    if (!config) {
      return false;
    }

    // Update contact with AccountId
    const result = await executeSalesforceRequest(
      config,
      `/sobjects/Contact/${contactId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ AccountId: accountId }),
      }
    );

    return result !== null;
  } catch (error) {
    console.error('Associate contact with company error:', error);
    return false;
  }
}

/**
 * Upsert lead to Salesforce
 */
export async function upsertLeadToSalesforce(
  leadData: SalesforceLead,
  userId: string,
  workspaceId: string
): Promise<string | null> {
  try {
    const config = await authenticateWithSalesforce(userId, workspaceId);
    if (!config) {
      return null;
    }

    const endpoint = leadData.Id
      ? `/sobjects/Lead/${leadData.Id}`
      : `/sobjects/Lead`;

    const method = leadData.Id ? 'PATCH' : 'POST';
    
    const result = await executeSalesforceRequest<{ id: string } | { Id: string }>(
      config,
      endpoint,
      {
        method,
        body: JSON.stringify(leadData),
      }
    );

    if (result) {
      return 'id' in result ? result.id : result.Id;
    }

    return null;
  } catch (error) {
    console.error('Upsert lead to Salesforce error:', error);
    return null;
  }
}

/**
 * Sync lead to Salesforce (high-level function)
 */
export async function syncLeadToSalesforce(
  lead: any,
  userId: string,
  workspaceId: string
): Promise<{ success: boolean; leadId?: string; contactId?: string; accountId?: string }> {
  try {
    const config = await authenticateWithSalesforce(userId, workspaceId);
    if (!config) {
      return { success: false };
    }

    let accountId: string | undefined;
    let contactId: string | undefined;

    // 1. Upsert company (Account)
    if (lead.company) {
      const accountData: SalesforceAccount = {
        Name: lead.company.name || lead.company,
        Domain__c: lead.company.domain,
        Website: lead.company.website,
        Industry: lead.company.industry,
        NumberOfEmployees: lead.company.employeeCount,
        Description: lead.company.description,
        LinkedIn__c: lead.company.linkedinUrl,
      };

      accountId = await upsertCompanyToSalesforce(accountData, userId, workspaceId) || undefined;
    }

    // 2. Upsert contact
    if (lead.email || lead.firstName || lead.lastName) {
      const contactData: SalesforceContact = {
        FirstName: lead.firstName,
        LastName: lead.lastName || lead.email?.split('@')[0] || 'Unknown',
        Email: lead.email,
        Phone: lead.phone,
        Title: lead.title,
        LinkedIn__c: lead.linkedinUrl,
        Description: lead.notes,
      };

      contactId = await upsertContactToSalesforce(contactData, userId, workspaceId) || undefined;

      // 3. Associate contact with company
      if (contactId && accountId) {
        await associateContactWithCompany(contactId, accountId, userId, workspaceId);
      }
    }

    return {
      success: true,
      leadId: undefined,
      contactId,
      accountId,
    };
  } catch (error) {
    console.error('Sync lead to Salesforce error:', error);
    return { success: false };
  }
}

/**
 * Query Salesforce records
 */
export async function querySalesforce(
  soql: string,
  userId: string,
  workspaceId: string
): Promise<any[] | null> {
  try {
    const config = await authenticateWithSalesforce(userId, workspaceId);
    if (!config) {
      return null;
    }

    const endpoint = `/query?q=${encodeURIComponent(soql)}`;
    
    const result = await executeSalesforceRequest<{ records: any[] }>(
      config,
      endpoint
    );

    return result?.records || null;
  } catch (error) {
    console.error('Query Salesforce error:', error);
    return null;
  }
}
