'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Search, MoreHorizontal, ExternalLink, Mail, Phone, Building2, RefreshCw, Download } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { ImportDialog } from '@/components/import/import-dialog'

interface Company {
  id: string
  companyId: string
  company: {
    id: string
    domain: string
    name: string | null
    phone: string | null
    email: string | null
    address: string | null
    city: string | null
    country: string | null
    employees: number | null
    industry: string | null
  }
  tags: string[]
  stage: string | null
  notes: string | null
  addedAt: string
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newCompany, setNewCompany] = useState({ domain: '', name: '' })
  const [enriching, setEnriching] = useState<string | null>(null)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'json'>('csv')
  const [exporting, setExporting] = useState(false)

  // 鍔犺浇公司鍒楄〃
  const loadCompanies = useCallback(async () => {
    try {
      const response = await fetch('/api/companies')
      if (!response.ok) throw new Error('Failed to load companies')
      const data = await response.json()
      setCompanies(data.companies || [])
    } catch (error) {
      console.error('Error loading companies:', error)
      toast.error('鍔犺浇公司澶辫触')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  const filteredCompanies = companies.filter(
    (company) =>
      company.company.name?.toLowerCase().includes(search.toLowerCase()) ||
      company.company.domain.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompany),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Add failed')
      }

      toast.success('公司娣诲姞鎴愬姛')
      setNewCompany({ domain: '', name: '' })
      setDialogOpen(false)
      loadCompanies()
    } catch (error) {
      console.error('Error adding company:', error)
      toast.error(error instanceof Error ? error.message : 'Add failed')
    }
  }

  const handleEnrich = async (companyId: string) => {
    setEnriching(companyId)
    try {
      const response = await fetch('/api/enrichment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      })

      if (!response.ok) throw new Error('涓板瘜澶辫触')

      toast.success('鏁版嵁涓板瘜鎴愬姛')
      loadCompanies()
    } catch (error) {
      console.error('Error enriching company:', error)
      toast.error('鏁版嵁涓板瘜澶辫触')
    } finally {
      setEnriching(null)
    }
  }

  const handleDelete = async (companyId: string) => {
    if (!confirm('Confirm delete?')) return

    try {
      const response = await fetch(`/api/companies?id=${companyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('删除澶辫触')

      toast.success('删除鎴愬姛')
      loadCompanies()
    } catch (error) {
      console.error('Error deleting company:', error)
      toast.error('删除澶辫触')
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: exportFormat,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export failed')
      }

      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `companies_${Date.now()}.${exportFormat === 'excel' ? 'xlsx' : exportFormat}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('瀵煎嚭鎴愬姛')
      setExportDialogOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      toast.error(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">公司</h1>
          <p className="text-muted-foreground mt-1">
            管理你的 B2B 线索公司，已添加 {companies.length} 瀹跺叕鍙?          </p>
        </div>
        <div className="flex gap-2">
          <ImportDialog />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
              添加公司
              </Button>
            </DialogTrigger>
            <DialogContent>
            <form onSubmit={handleAddCompany}>
              <DialogHeader>
                <DialogTitle>Add New Company</DialogTitle>
                <DialogDescription>
                  输入公司域名，系统将自动丰富公司信息
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="domain">公司域名 *</Label>
                  <Input
                    id="domain"
                    placeholder="example.com"
                    value={newCompany.domain}
                    onChange={(e) =>
                      setNewCompany({ ...newCompany, domain: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">公司名称（可选）</Label>
                  <Input
                    id="name"
                    placeholder="Example Inc."
                    value={newCompany.name}
                    onChange={(e) =>
                      setNewCompany({ ...newCompany, name: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add and Enrich</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="鎼滅储公司鍚嶇О鎴栧煙鍚?.."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <CardContent>
          <TableHeader>
          <TableRow>
            <TableHead>公司</TableHead>
            <TableHead>行业</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>联系方式</TableHead>
            <TableHead>阶段</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              </TableCell>
            </TableRow>
          ) : filteredCompanies.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Building2 className="h-8 w-8" />
                  <p>暂无公司数据</p>
                  <p className="text-sm">Click "Add Company" to start</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredCompanies.map((company) => (
              <TableRow key={company.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {company.company.name || company.company.domain}
                    </div>
                    <a
                      href={`https://${company.company.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                    >
                      {company.company.domain}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </TableCell>
                <TableCell>{company.company.industry || '-'}</TableCell>
                <TableCell>
                  {company.company.employees?.toLocaleString() || '-'}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {company.company.phone && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {company.company.phone}
                      </div>
                    )}
                    {company.company.email && (
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3" />
                        {company.company.email}
                      </div>
                    )}
                    {!company.company.phone && !company.company.email && '-'}
                  </div>
                </TableCell>
                <TableCell>
                  {company.stage ? (
                    <Badge variant={company.stage === 'High Intent' ? 'default' : 'secondary'}>
                      {company.stage}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Not Set</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEnrich(company.companyId)}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${enriching === company.companyId ? 'animate-spin' : ''}`} />
                        {enriching === company.companyId ? 'Enriching....' : 'Enrich data'}
                      </DropdownMenuItem>
                      <DropdownMenuItem>编辑信息</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(company.companyId)}>
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        </CardContent>
      </Card>
    </div>
  )
}

