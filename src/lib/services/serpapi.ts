/**
 * SerpAPI — Google Search results for company enrichment and prospecting.
 */

export interface SerpResult {
  title: string
  link: string
  snippet: string
}

/**
 * Raw search — returns organic results for any query.
 */
export async function searchWithSerpApi(query: string): Promise<SerpResult[]> {
  const apiKey = process.env.SERPAPI_KEY
  if (!apiKey) return []

  try {
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey}&engine=google&num=10`
    const response = await fetch(url)
    if (!response.ok) return []
    const data = await response.json()
    return (data.organic_results || []).map((r: any) => ({
      title: r.title || '',
      link: r.link || '',
      snippet: r.snippet || '',
    }))
  } catch (error) {
    console.error('SerpAPI error:', error)
    return []
  }
}

/**
 * Company-specific enrichment: extract description from top Google results.
 */
export async function enrichFromSerpApi(domain: string) {
  const results = await searchWithSerpApi(`${domain} company overview`)
  if (results.length === 0) return null

  const description = results
    .slice(0, 3)
    .map((r) => r.snippet)
    .filter(Boolean)
    .join(' ')
    .substring(0, 800)

  if (!description) return null

  return {
    data: { description },
    sources: [
      {
        name: 'Google Search (SerpAPI)',
        url: results[0].link,
        timestamp: new Date().toISOString(),
        type: 'google_search',
      },
    ],
  }
}
