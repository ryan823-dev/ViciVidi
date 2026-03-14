/**
 * 潜在客户发现 API
 * 
 * 统一接口，从多个数据源发现潜在客户：
 * - LinkedIn
 * - GitHub
 * - Product Hunt
 * - AngelList
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUser, getWorkspace } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspace = await getWorkspace()
    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      source,
      keywords,
      location,
      technologies,
      industry,
      limit = 20,
    } = body

    let results: any[] = []

    // 根据数据源选择
    switch (source) {
      case 'linkedin': {
        const { searchLinkedInCompanies, searchLinkedInPeople } = await import(
          '@/lib/services/linkedin-scraper'
        )
        
        if (keywords) {
          const companies = await searchLinkedInCompanies(keywords, location)
          results = companies.map(c => ({
            ...c,
            source: 'LinkedIn',
            type: 'company',
          }))
        }
        break
      }

      case 'github': {
        const { searchGitHubOrganizations, searchGitHubDevelopers } = await import(
          '@/lib/services/github-prospector'
        )
        
        if (technologies?.length) {
          const companies = await searchGitHubOrganizations(technologies)
          results = companies.map(c => ({
            ...c,
            source: 'GitHub',
            type: 'company',
          }))
        }
        break
      }

      case 'producthunt': {
        const { getTodaysProducts, searchProducts, getProductsByTopic } = await import(
          '@/lib/services/product-hunt-scraper'
        )
        
        if (keywords) {
          const products = await searchProducts(keywords)
          results = products.map(p => ({
            ...p,
            source: 'Product Hunt',
            type: 'product',
            makers: p.makers?.map((m: any) => ({
              ...m,
              type: 'person',
            })),
          }))
        } else {
          const products = await getTodaysProducts()
          results = products.map(p => ({
            ...p,
            source: 'Product Hunt',
            type: 'product',
            makers: p.makers?.map((m: any) => ({
              ...m,
              type: 'person',
            })),
          }))
        }
        break
      }

      case 'angellist': {
        const { searchAngelListCompanies, searchByIndustry, searchRecentlyFunded } = await import(
          '@/lib/services/angellist-scraper'
        )
        
        if (industry) {
          const companies = await searchByIndustry(industry, location)
          results = companies.map(c => ({
            ...c,
            source: 'AngelList',
            type: 'company',
          }))
        } else if (keywords) {
          const companies = await searchAngelListCompanies(keywords, location)
          results = companies.map(c => ({
            ...c,
            source: 'AngelList',
            type: 'company',
          }))
        }
        break
      }

      default:
        return NextResponse.json(
          { error: 'Invalid source. Use: linkedin, github, producthunt, angellist' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: results.slice(0, limit),
      count: results.length,
    })
  } catch (error) {
    console.error('Discover prospects error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/prospects/discover?source=linkedin&keywords=saas
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspace = await getWorkspace()
    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source')
    const keywords = searchParams.get('keywords')
    const location = searchParams.get('location')
    const technologies = searchParams.get('technologies')
    const industry = searchParams.get('industry')
    const limit = parseInt(searchParams.get('limit') || '20')

    // 转换为 POST 请求格式
    const body = {
      source,
      keywords,
      location,
      technologies: technologies ? technologies.split(',') : undefined,
      industry,
      limit,
    }

    // 复用 POST 逻辑
    const postRequest = new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify(body),
    })

    return await POST(postRequest)
  } catch (error) {
    console.error('Discover prospects GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
