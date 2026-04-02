/**
 * Exa.ai Neural Search Service
 * Semantic search for company context and similar company discovery.
 */

export async function enrichFromExa(domain: string) {
  const apiKey = process.env.EXA_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `Company profile and key business activities of ${domain}`,
        useAutoprompt: true,
        type: 'neural',
        numResults: 3,
        contents: { text: true, highlights: true },
      }),
    })

    if (!response.ok) return null
    const data = await response.json()
    const results = data.results || []
    if (results.length === 0) return null

    const top = results[0]
    const description: string | undefined =
      top.highlights?.[0] || top.text?.substring(0, 500) || undefined

    return {
      data: { description },
      sources: [
        {
          name: 'Exa.ai',
          url: top.url,
          timestamp: new Date().toISOString(),
          type: 'neural_search',
        },
      ],
    }
  } catch (error) {
    console.error('Exa search error:', error)
    return null
  }
}

/**
 * Find similar companies using Exa "findSimilar" endpoint.
 * Returns a list of similar domains/URLs — useful for prospecting.
 */
export async function findSimilarCompanies(domain: string): Promise<string[]> {
  const apiKey = process.env.EXA_API_KEY
  if (!apiKey) return []

  try {
    const response = await fetch('https://api.exa.ai/findSimilar', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `https://${domain}`,
        numResults: 10,
      }),
    })

    if (!response.ok) return []
    const data = await response.json()
    return (data.results || []).map((r: { url: string }) => r.url)
  } catch (error) {
    console.error('Exa findSimilar error:', error)
    return []
  }
}
