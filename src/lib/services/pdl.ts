/**
 * People Data Labs (PDL) Company Enrichment Service
 * Industry-grade company data: employees, revenue range, LinkedIn, description.
 */

export async function enrichFromPDL(domain: string) {
  const apiKey = process.env.PDL_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch(
      `https://api.peopledatalabs.com/v5/company/enrich?website=${domain}`,
      {
        headers: { 'X-Api-Key': apiKey },
      }
    )

    if (!response.ok) return null
    const data = await response.json()
    if (data.status !== 200) return null

    // PDL size comes as a string like "51-200"; take the lower bound as an int
    let employees: number | undefined
    if (data.size) {
      const lower = parseInt(data.size.split('-')[0].replace(/\D/g, ''), 10)
      if (!isNaN(lower)) employees = lower
    }

    return {
      data: {
        name: data.name || undefined,
        employees,
        industry: data.industry || undefined,
        linkedinUrl: data.linkedin_url || undefined,
        website: data.website || undefined,
        description: data.summary || undefined,
        city: data.location?.city || undefined,
        country: data.location?.country || undefined,
      },
      sources: [
        {
          name: 'People Data Labs',
          url: 'https://peopledatalabs.com',
          timestamp: new Date().toISOString(),
          type: 'premium_data',
        },
      ],
    }
  } catch (error) {
    console.error('PDL error:', error)
    return null
  }
}
