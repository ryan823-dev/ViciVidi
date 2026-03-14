// ============================================
// ViciVidi AI - Type Definitions
// ============================================

// ========== 枚举 ==========

export type Plan = 'STARTER' | 'PRO' | 'BUSINESS' | 'ENTERPRISE'
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER'
export type DataSource = 'google_places' | 'brave_search' | 'hunter' | 'firecrawl' | 'manual'

// ========== 用户与工作空间 ==========

export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  emailVerified: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Workspace {
  id: string
  name: string
  slug: string
  plan: Plan
  createdAt: Date
  updatedAt: Date
}

export interface WorkspaceMember {
  id: string
  workspaceId: string
  userId: string
  role: MemberRole
  joinedAt: Date
  workspace?: Workspace
}

// ========== 配额 ==========

export interface UserQuota {
  id: string
  userId: string
  plan: Plan
  usedCompanies: number
  usedEmailVerifications: number
  usedExports: number
  extraEmailVerifications: number
  periodStart: Date
  periodEnd: Date
}

export interface QuotaStatus {
  companies: { used: number; limit: number; remaining: number; percentage: number }
  emailVerifications: { used: number; limit: number; remaining: number; percentage: number }
  exports: { used: number; limit: number; remaining: number; percentage: number }
}

// ========== 公司 ==========

export interface SourceEvidence {
  field: string
  source_url: string
  snippet: string
  confidence: number
  verified_at: string
}

export interface SharedCompany {
  id: string
  domain: string
  name: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  country: string | null
  postalCode: string | null
  employees: number | null
  revenue: bigint | null
  industry: string | null
  linkedinUrl: string | null
  website: string | null
  description: string | null
  sources: SourceEvidence[]
  createdAt: Date
  updatedAt: Date
  lastVerifiedAt: Date | null
}

export interface WorkspaceCompany {
  id: string
  workspaceId: string
  companyId: string
  customFields: Record<string, unknown>
  tags: string[]
  notes: string | null
  stage: string | null
  assignedTo: string | null
  addedAt: Date
  lastActivityAt: Date | null
  company?: SharedCompany
}

// ========== 列表 ==========

export interface List {
  id: string
  workspaceId: string
  name: string
  description: string | null
  color: string | null
  createdAt: Date
  updatedAt: Date
  itemCount?: number
}

export interface ListItem {
  id: string
  listId: string
  companyId: string
  addedAt: Date
  company?: WorkspaceCompany
}

// ========== 智能调研 ==========

export interface ResearchTemplate {
  id: string
  workspaceId: string | null
  name: string
  description: string | null
  prompt: string
  outputType: 'text' | 'list' | 'json'
  isPublic: boolean
  usageCount: number
  createdAt: Date
}

// ========== API响应 ==========

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ========== 表单输入 ==========

export interface CreateCompanyInput {
  domain: string
  name?: string
  website?: string
}

export interface UpdateCompanyInput {
  name?: string
  notes?: string
  tags?: string[]
  stage?: string
  assignedTo?: string
}

export interface CreateListInput {
  name: string
  description?: string
  color?: string
}