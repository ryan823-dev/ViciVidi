/**
 * HubSpot CRM 集成服务
 * 
 * 功能：
 * - 同步联系人到 HubSpot
 * - 同步公司到 HubSpot
 * - 从 HubSpot 获取联系人/公司
 * - 双向同步
 */

const HUBSPOT_API = 'https://api.hubapi.com'

export interface HubSpotContact {
  id?: string
  email: string
  firstname?: string
  lastname?: string
  phone?: string
  company?: string
  jobtitle?: string
  linkedinbio?: string
  website?: string
  city?: string
  country?: string
}

export interface HubSpotCompany {
  id?: string
  name: string
  domain?: string
  website?: string
  industry?: string
  numberofemployees?: number
  annualrevenue?: number
  description?: string
  phone?: string
  city?: string
  state?: string
  country?: string
  linkedinbio?: string
  twitterhandle?: string
}

/**
 * 获取 HubSpot API Key
 */
async function getHubSpotApiKey(): Promise<string | null> {
  const { getApiKey } = await import('@/lib/api-keys')
  const { apiKey } = await getApiKey('hubspot', 'default')
  return apiKey
}

/**
 * 创建/更新 HubSpot 联系人
 */
export async function upsertContactToHubSpot(
  contact: HubSpotContact
): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = await getHubSpotApiKey()
  
  if (!apiKey) {
    return { success: false, error: 'HubSpot API key not configured' }
  }

  try {
    // 先检查是否已存在
    const existingResponse = await fetch(
      `${HUBSPOT_API}/crm/v3/objects/contacts/${contact.email}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    let contactId: string | undefined

    if (existingResponse.ok) {
      // 更新现有联系人
      const existing = await existingResponse.json()
      contactId = existing.id

      const updateResponse = await fetch(
        `${HUBSPOT_API}/crm/v3/objects/contacts/${contactId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              email: contact.email,
              firstname: contact.firstname,
              lastname: contact.lastname,
              phone: contact.phone,
              company: contact.company,
              jobtitle: contact.jobtitle,
              linkedinbio: contact.linkedinbio,
              website: contact.website,
              city: contact.city,
              country: contact.country,
            },
          }),
        }
      )

      if (!updateResponse.ok) {
        throw new Error('Failed to update contact')
      }
    } else {
      // 创建新联系人
      const createResponse = await fetch(
        `${HUBSPOT_API}/crm/v3/objects/contacts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              email: contact.email,
              firstname: contact.firstname,
              lastname: contact.lastname,
              phone: contact.phone,
              company: contact.company,
              jobtitle: contact.jobtitle,
              linkedinbio: contact.linkedinbio,
              website: contact.website,
              city: contact.city,
              country: contact.country,
            },
          }),
        }
      )

      if (!createResponse.ok) {
        throw new Error('Failed to create contact')
      }

      const created = await createResponse.json()
      contactId = created.id
    }

    return { success: true, id: contactId }
  } catch (error) {
    console.error('HubSpot contact upsert error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 创建/更新 HubSpot 公司
 */
export async function upsertCompanyToHubSpot(
  company: HubSpotCompany
): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = await getHubSpotApiKey()
  
  if (!apiKey) {
    return { success: false, error: 'HubSpot API key not configured' }
  }

  try {
    // 先通过域名检查是否已存在
    let companyId: string | undefined

    if (company.domain) {
      const searchResponse = await fetch(
        `${HUBSPOT_API}/crm/v3/objects/companies/search`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filterGroups: [
              {
                filters: [
                  {
                    propertyName: 'domain',
                    operator: 'EQ',
                    value: company.domain,
                  },
                ],
              },
            ],
          }),
        }
      )

      if (searchResponse.ok) {
        const searchResult = await searchResponse.json()
        if (searchResult.results?.length > 0) {
          companyId = searchResult.results[0].id
        }
      }
    }

    if (companyId) {
      // 更新现有公司
      const updateResponse = await fetch(
        `${HUBSPOT_API}/crm/v3/objects/companies/${companyId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              name: company.name,
              domain: company.domain,
              website: company.website,
              industry: company.industry,
              numberofemployees: company.numberofemployees,
              annualrevenue: company.annualrevenue,
              description: company.description,
              phone: company.phone,
              city: company.city,
              state: company.state,
              country: company.country,
              linkedinbio: company.linkedinbio,
              twitterhandle: company.twitterhandle,
            },
          }),
        }
      )

      if (!updateResponse.ok) {
        throw new Error('Failed to update company')
      }
    } else {
      // 创建新公司
      const createResponse = await fetch(
        `${HUBSPOT_API}/crm/v3/objects/companies`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              name: company.name,
              domain: company.domain,
              website: company.website,
              industry: company.industry,
              numberofemployees: company.numberofemployees,
              annualrevenue: company.annualrevenue,
              description: company.description,
              phone: company.phone,
              city: company.city,
              state: company.state,
              country: company.country,
              linkedinbio: company.linkedinbio,
              twitterhandle: company.twitterhandle,
            },
          }),
        }
      )

      if (!createResponse.ok) {
        throw new Error('Failed to create company')
      }

      const created = await createResponse.json()
      companyId = created.id
    }

    return { success: true, id: companyId }
  } catch (error) {
    console.error('HubSpot company upsert error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 关联联系人与公司
 */
export async function associateContactWithCompany(
  contactId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = await getHubSpotApiKey()
  
  if (!apiKey) {
    return { success: false, error: 'HubSpot API key not configured' }
  }

  try {
    const response = await fetch(
      `${HUBSPOT_API}/crm/v3/objects/contacts/${contactId}/associations/companies/${companyId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          types: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: 1, // Contact to Company
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to associate contact with company')
    }

    return { success: true }
  } catch (error) {
    console.error('HubSpot association error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 从 Lead 同步到 HubSpot
 */
export async function syncLeadToHubSpot(lead: {
  id: string
  companyName: string
  contactName?: string | null
  email?: string | null
  phone?: string | null
  domain?: string | null
  industry?: string | null
  companySize?: string | null
  country?: string | null
  city?: string | null
}): Promise<{
  success: boolean
  contactId?: string
  companyId?: string
  error?: string
}> {
  try {
    // 1. 同步公司
    const companyResult = await upsertCompanyToHubSpot({
      name: lead.companyName,
      domain: lead.domain || undefined,
      industry: lead.industry || undefined,
      numberofemployees: lead.companySize
        ? parseCompanySize(lead.companySize)
        : undefined,
      country: lead.country || undefined,
      city: lead.city || undefined,
    })

    if (!companyResult.success) {
      return { success: false, error: companyResult.error }
    }

    // 2. 同步联系人（如果有）
    let contactId: string | undefined

    if (lead.email && lead.contactName) {
      const [firstname, lastname] = lead.contactName.split(' ')
      
      const contactResult = await upsertContactToHubSpot({
        email: lead.email,
        firstname: firstname || undefined,
        lastname: lastname || undefined,
        phone: lead.phone || undefined,
        company: lead.companyName,
        country: lead.country || undefined,
        city: lead.city || undefined,
      })

      if (!contactResult.success) {
        return { success: false, error: contactResult.error }
      }

      contactId = contactResult.id

      // 3. 关联联系人与公司
      if (companyResult.id && contactId) {
        await associateContactWithCompany(contactId, companyResult.id)
      }
    }

    return {
      success: true,
      contactId,
      companyId: companyResult.id,
    }
  } catch (error) {
    console.error('Sync lead to HubSpot error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 解析公司规模为数字
 */
function parseCompanySize(size: string): number | undefined {
  const match = size.match(/(\d+)-(\d+)/)
  if (match) {
    return Math.floor((parseInt(match[1]) + parseInt(match[2])) / 2)
  }
  
  const singleMatch = size.match(/(\d+)/)
  if (singleMatch) {
    return parseInt(singleMatch[1])
  }
  
  return undefined
}
