import { NextRequest, NextResponse } from 'next/server'
import { getUser, getWorkspace } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { checkQuota, consumeQuota } from '@/lib/services/quota'
import { z } from 'zod'
import * as XLSX from 'xlsx'

// Schema for export request
const exportSchema = z.object({
  format: z.enum(['csv', 'excel', 'json']).default('csv'),
  companyIds: z.array(z.string()).optional(),
  fields: z.array(z.string()).optional(),
})

// POST /api/export - Export companies
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
    const { format = 'csv', companyIds, fields } = exportSchema.parse(body)

    // Check quota
    const quotaCheck = await checkQuota(user.id, 'exports', 1)
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Export quota exceeded',
          remaining: quotaCheck.remaining,
          suggestion: 'Upgrade your plan',
        },
        { status: 402 }
      )
    }

    // Get companies
    const where = {
      workspaceId: workspace.id,
      ...(companyIds && companyIds.length > 0
        ? { companyId: { in: companyIds } }
        : {}),
    }

    const companies = await prisma.workspaceCompany.findMany({
      where,
      include: {
        company: true,
      },
      orderBy: {
        addedAt: 'desc',
      },
    })

    if (companies.length === 0) {
      return NextResponse.json(
        { error: 'No companies to export' },
        { status: 400 }
      )
    }

    // Define export fields
    const allFields = [
      { key: 'company.name', label: '公司名称' },
      { key: 'company.domain', label: '域名' },
      { key: 'company.website', label: '网站' },
      { key: 'company.phone', label: '电话' },
      { key: 'company.email', label: '邮箱' },
      { key: 'company.address', label: '地址' },
      { key: 'company.city', label: '城市' },
      { key: 'company.country', label: '国家' },
      { key: 'company.industry', label: '行业' },
      { key: 'company.employees', label: '员工数' },
      { key: 'stage', label: '阶段' },
      { key: 'tags', label: '标签' },
      { key: 'notes', label: '备注' },
      { key: 'addedAt', label: '添加时间' },
    ]

    const exportFields = fields?.length
      ? allFields.filter((f) => fields.includes(f.key))
      : allFields

    let content: string | Uint8Array
    let filename: string
    let contentType: string

    if (format === 'json') {
      // JSON export
      const data = companies.map((c) => {
        const item: Record<string, unknown> = {}
        exportFields.forEach((field) => {
          const keys = field.key.split('.')
          let value: unknown = c
          for (const key of keys) {
            value = (value as any)?.[key]
          }
          item[field.label] = value
        })
        return item
      })

      content = JSON.stringify(data, null, 2)
      filename = `companies_${Date.now()}.json`
      contentType = 'application/json'
    } else if (format === 'excel') {
      // Excel export
      const data = companies.map((c) => {
        const item: Record<string, unknown> = {}
        exportFields.forEach((field) => {
          const keys = field.key.split('.')
          let value: unknown = c
          for (const key of keys) {
            value = (value as any)?.[key]
          }
          item[field.label] = value
        })
        return item
      })

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Companies')

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      content = new Uint8Array(buffer as ArrayBuffer)
      filename = `companies_${Date.now()}.xlsx`
      contentType =
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } else {
      // CSV export
      const headers = exportFields.map((f) => f.label).join(',')
      const rows = companies.map((c) => {
        const values = exportFields.map((field) => {
          const keys = field.key.split('.')
          let value: unknown = c
          for (const key of keys) {
            value = (value as any)?.[key]
          }
          // Escape commas and quotes
          const str = String(value ?? '')
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        return values.join(',')
      })

      content = [headers, ...rows].join('\n')
      filename = `companies_${Date.now()}.csv`
      contentType = 'text/csv'
    }

    // Consume quota
    await consumeQuota(user.id, 'exports', 1)

    // Log export
    await prisma.apiCallLog.create({
      data: {
        service: 'export',
        operation: `${format}_export`,
        cost: 0,
        success: true,
        metadata: {
          format,
          count: companies.length,
          filename,
        },
      },
    })

    // Return file
    const fileBody = typeof content === 'string' ? content : Uint8Array.from(content)
    return new NextResponse(fileBody, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error exporting companies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}