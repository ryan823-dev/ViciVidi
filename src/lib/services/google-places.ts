/**
 * Google Places API 服务
 * 获取公司电话、地址等基础信息
 */

interface GooglePlaceResult {
  name?: string
  formatted_phone_number?: string
  formatted_address?: string
  website?: string
  place_id?: string
}

interface EnrichmentResult {
  data: Record<string, unknown>
  sources: Array<{
    field: string
    source_url: string
    snippet: string
    confidence: number
    verified_at: string
  }>
}

export async function enrichFromGooglePlaces(
  domain: string
): Promise<EnrichmentResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    console.warn('Google Places API key not configured')
    return null
  }

  try {
    // Search for the company
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(domain)}&inputtype=textquery&fields=place_id,name,formatted_address,formatted_phone_number,website&key=${apiKey}`

    const response = await fetch(searchUrl)
    const data = await response.json()

    if (!data.candidates || data.candidates.length === 0) {
      return null
    }

    const place: GooglePlaceResult = data.candidates[0]
    const sources: EnrichmentResult['sources'] = []

    const result: EnrichmentResult = {
      data: {},
      sources: []
    }

    if (place.name) {
      result.data.name = place.name
      sources.push({
        field: 'name',
        source_url: `https://maps.google.com/?place_id=${place.place_id}`,
        snippet: place.name,
        confidence: 0.9,
        verified_at: new Date().toISOString(),
      })
    }

    if (place.formatted_phone_number) {
      result.data.phone = place.formatted_phone_number
      sources.push({
        field: 'phone',
        source_url: `https://maps.google.com/?place_id=${place.place_id}`,
        snippet: place.formatted_phone_number,
        confidence: 0.9,
        verified_at: new Date().toISOString(),
      })
    }

    if (place.formatted_address) {
      result.data.address = place.formatted_address
      sources.push({
        field: 'address',
        source_url: `https://maps.google.com/?place_id=${place.place_id}`,
        snippet: place.formatted_address,
        confidence: 0.85,
        verified_at: new Date().toISOString(),
      })
    }

    if (place.website) {
      result.data.website = place.website
      sources.push({
        field: 'website',
        source_url: `https://maps.google.com/?place_id=${place.place_id}`,
        snippet: place.website,
        confidence: 0.9,
        verified_at: new Date().toISOString(),
      })
    }

    result.sources = sources

    // Log API usage
    await logApiCall('google_places', 'find_place', 0.017, true)

    return result
  } catch (error) {
    console.error('Google Places enrichment error:', error)
    await logApiCall('google_places', 'find_place', 0, false)
    return null
  }
}

async function logApiCall(
  service: string,
  operation: string,
  cost: number,
  success: boolean
) {
  try {
    const { prisma } = await import('@/lib/db')
    await prisma.apiCallLog.create({
      data: {
        service,
        operation,
        cost,
        success,
        metadata: { timestamp: new Date().toISOString() },
      },
    })
  } catch (error) {
    console.error('Failed to log API call:', error)
  }
}