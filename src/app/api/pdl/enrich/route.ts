/**
 * PDL 数据丰富化 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUser, getWorkspace } from '@/lib/supabase/server'
import {
  enrichPersonByEmail,
  enrichPersonByName,
  enrichCompanyByDomain,
  searchPeople,
  searchCompanies,
} from '@/lib/services/pdl-enrichment'

// POST /api/pdl/enrich/person
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
    const { type, email, firstName, lastName, domain, city, country } = body

    let result: any = null

    if (type === 'person') {
      if (email) {
        result = await enrichPersonByEmail(email)
      } else if (firstName && lastName) {
        result = await enrichPersonByName(firstName, lastName, {
          domain,
          city,
          country,
        })
      }
    } else if (type === 'company' && domain) {
      result = await enrichCompanyByDomain(domain)
    }

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'No data found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('PDL enrich error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/pdl/search
export async function POST_SEARCH(request: NextRequest) {
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
    const { type, ...options } = body

    let results: any[] = []

    if (type === 'people') {
      results = await searchPeople(options)
    } else if (type === 'companies') {
      results = await searchCompanies(options)
    }

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
    })
  } catch (error) {
    console.error('PDL search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
