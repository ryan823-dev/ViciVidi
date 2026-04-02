/**
 * Tavily AI Search Service
 * Designed for AI agents — returns clean, pre-summarized business context.
 */

export async function enrichFromTavily(domain: string) {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: `Company overview, core products, and business model of ${domain}`,
        search_depth: 'advanced',
        include_answer: true,
        max_results: 5,
      }),
    })

    if (!response.ok) return null
    const data = await response.json()
    if (!data?.results) return null

    const description: string | undefined =
      data.answer || data.results[0]?.content?.substring(0, 500) || undefined

    return {
      data: { description },
      sources: [
        {
          name: 'Tavily AI',
          url: data.results[0]?.url,
          timestamp: new Date().toISOString(),
          type: 'ai_search',
        },
      ],
    }
  } catch (error) {
    console.error('Tavily error:', error)
    return null
  }
}
