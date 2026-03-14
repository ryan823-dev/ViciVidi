/**
 * 瀑布式数据丰富化 API
 * 依次尝试多个数据源，最大化数据补齐成功率
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUser, getWorkspace } from '@/lib/supabase/server'
import { waterfallEnrichCompany, waterfallFindContacts } from '@/lib/services/data-enrichment'

// GET /api/enrichment/waterfall?domain=example.com
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
    const domain = searchParams.get('domain')

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      )
    }

    // 执行瀑布式丰富化
    const { result, stats } = await waterfallEnrichCompany(domain)

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: 'No data found from any provider',
          stats,
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result,
      stats,
    })
  } catch (error) {
    console.error('Waterfall enrichment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/enrichment/waterfall/contacts
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
    const { domain, roles } = body

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      )
    }

    // 查找关键联系人
    const { contacts, stats } = await waterfallFindContacts(
      domain,
      roles || ['CEO', 'CTO', 'CFO', 'VP', 'Director']
    )

    if (contacts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No contacts found',
          stats,
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: contacts,
      stats,
    })
  } catch (error) {
    console.error('Contact enrichment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
