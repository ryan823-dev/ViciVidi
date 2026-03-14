import { NextRequest, NextResponse } from 'next/server'
import { getUser, getWorkspace } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { checkQuota, consumeQuota } from '@/lib/services/quota'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface ImportResult {
  success: number
  failed: number
  duplicates: number
  errors: Array<{
    row: number
    domain: string
    error: string
  }>
}

// POST /api/import - Import companies from CSV/Excel
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

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const skipQuotaCheck = formData.get('skipQuotaCheck') === 'true'

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload CSV or Excel file.' },
        { status: 400 }
      )
    }

    // Parse file content
    const content = await file.text()
    let domains: string[] = []

    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      // Parse CSV
      const parsed = Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.toLowerCase().trim(),
      })

      // Extract domains from CSV
      domains = parsed.data
        .map((row: any) => row.domain || row.website || row.url || row.company)
        .filter(Boolean)
        .map((d: string) => {
          // Normalize domain
          return d
            .toLowerCase()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .split('/')[0]
            .trim()
        })
    } else {
      // Parse Excel
      const workbook = XLSX.read(content, { type: 'binary' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(sheet) as any[]

      domains = data
        .map((row: any) => row.domain || row.website || row.url || row.company)
        .filter(Boolean)
        .map((d: string) => {
          return d
            .toLowerCase()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .split('/')[0]
            .trim()
        })
    }

    // Remove duplicates and empty values
    domains = [...new Set(domains)].filter(Boolean)

    if (domains.length === 0) {
      return NextResponse.json(
        { error: 'No valid domains found in file' },
        { status: 400 }
      )
    }

    // Check quota (unless skipped for testing)
    if (!skipQuotaCheck) {
      const quotaCheck = await checkQuota(user.id, 'companies', domains.length)
      if (!quotaCheck.allowed) {
        return NextResponse.json(
          {
            error: 'Not enough quota',
            required: domains.length,
            remaining: quotaCheck.remaining,
            suggestion: 'Remove some rows or upgrade your plan',
          },
          { status: 402 }
        )
      }
    }

    // Process import
    const result: ImportResult = {
      success: 0,
      failed: 0,
      duplicates: 0,
      errors: [],
    }

    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i]
      const row = i + 2 // Excel row number (1-based, +1 for header)

      try {
        // Check if domain already exists in shared database
        let sharedCompany = await prisma.sharedCompany.findUnique({
          where: { domain },
        })

        // Create if not exists
        if (!sharedCompany) {
          sharedCompany = await prisma.sharedCompany.create({
            data: {
              domain,
              website: `https://${domain}`,
            },
          })
        }

        // Check if already in workspace
        const existingInWorkspace = await prisma.workspaceCompany.findUnique({
          where: {
            workspaceId_companyId: {
              workspaceId: workspace.id,
              companyId: sharedCompany.id,
            },
          },
        })

        if (existingInWorkspace) {
          result.duplicates++
          continue
        }

        // Add to workspace
        await prisma.workspaceCompany.create({
          data: {
            workspaceId: workspace.id,
            companyId: sharedCompany.id,
          },
        })

        result.success++
      } catch (error) {
        result.failed++
        result.errors.push({
          row,
          domain,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Consume quota
    if (!skipQuotaCheck && result.success > 0) {
      await consumeQuota(user.id, 'companies', result.success)
    }

    // Log API usage
    await prisma.apiCallLog.create({
      data: {
        service: 'import',
        operation: 'csv_excel_import',
        cost: 0,
        success: true,
        metadata: {
          totalRows: domains.length,
          success: result.success,
          failed: result.failed,
          duplicates: result.duplicates,
          filename: file.name,
        },
      },
    })

    return NextResponse.json({
      message: `Imported ${result.success} companies`,
      ...result,
    })
  } catch (error) {
    console.error('Error importing companies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}