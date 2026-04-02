/**
 * BuiltWith Technology Profiler Service
 * Identifies eCommerce platforms, analytics, payments, CDN, etc.
 */

export async function enrichFromBuiltWith(domain: string) {
  const apiKey = process.env.BUILTWITH_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch(
      `https://api.builtwith.com/v20/api.json?KEY=${apiKey}&LOOKUP=${domain}`
    )
    if (!response.ok) return null

    const data = await response.json()
    if (!data?.Results?.length) return null

    const paths: any[] = data.Results[0]?.Result?.Paths || []
    const seen = new Set<string>()
    const technologies: string[] = []

    for (const path of paths) {
      for (const tech of path.Technologies || []) {
        if (!seen.has(tech.Name)) {
          seen.add(tech.Name)
          technologies.push(tech.Name)
          if (technologies.length >= 20) break
        }
      }
      if (technologies.length >= 20) break
    }

    if (technologies.length === 0) return null

    return {
      data: { techStack: technologies },
      sources: [
        {
          name: 'BuiltWith',
          url: `https://builtwith.com/${domain}`,
          timestamp: new Date().toISOString(),
          type: 'tech_stack',
        },
      ],
    }
  } catch (error) {
    console.error('BuiltWith error:', error)
    return null
  }
}
