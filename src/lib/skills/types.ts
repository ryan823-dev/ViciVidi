import { z } from 'zod';
import type { EntityType } from '@/types/artifact';

// ==================== Skill Engine Types ====================

export type SkillEngine = 'radar' | 'marketing';
export type SkillMode = 'generate' | 'refine' | 'verify';

// ==================== Prompt Context ====================

export interface PromptContext {
  input: Record<string, unknown>;
  companyProfile?: CompanyProfileContext;
  evidences?: EvidenceContext[];
  existingContent?: Record<string, unknown>;
  mode: SkillMode;
}

export interface CompanyProfileContext {
  companyName: string;
  companyIntro: string;
  coreProducts: Array<{ name: string; description: string }>;
  techAdvantages: Array<{ title: string; description: string }>;
  scenarios: Array<{ industry: string; scenario: string }>;
  differentiators: Array<{ point: string; description: string }>;
  targetIndustries: string[];
  targetRegions: string[];
  buyerPersonas: Array<{ role: string; title: string; concerns: string[] }>;
  painPoints: Array<{ pain: string; howWeHelp: string }>;
  buyingTriggers: string[];
}

export interface EvidenceContext {
  id: string;
  label: string;  // E1, E2, ...
  title: string;
  content: string;
  type: string;
}

// ==================== Skill Definition ====================

export interface SkillDefinition<
  TInput extends z.ZodTypeAny = z.ZodTypeAny,
  TOutput extends z.ZodTypeAny = z.ZodTypeAny
> {
  /** 唯一标识符，格式 {engine}.{action}，如 radar.buildTargetingSpec */
  name: string;
  
  /** 中文展示名 */
  displayName: string;
  
  /** 所属引擎 */
  engine: SkillEngine;
  
  /** 输出产物的 EntityType */
  outputEntityType: EntityType;
  
  /** 输入验证 Schema */
  inputSchema: TInput;
  
  /** 输出验证 Schema (不含通用字段) */
  outputSchema: TOutput;
  
  /** System Prompt */
  systemPrompt: string;
  
  /** 构建 User Prompt */
  buildUserPrompt: (ctx: PromptContext) => string;
  
  /** 推荐的后续 Skill */
  suggestedNextSkills: string[];
  
  /** 覆盖默认模型 */
  model?: 'qwen-plus' | 'qwen-max' | 'deepseek';
  
  /** 温度参数 */
  temperature?: number;
}

// ==================== Skill Request/Response ====================

export interface SkillRequest {
  /** 目标实体类型 */
  entityType: EntityType;
  
  /** 目标实体 ID */
  entityId: string;
  
  /** 基于已有版本进行 refine/verify */
  artifactVersionId?: string;
  
  /** Skill 特有输入参数 */
  input: Record<string, unknown>;
  
  /** 执行模式 */
  mode: SkillMode;
  
  /** 明确指定注入的 Evidence IDs */
  evidenceIds?: string[];
  
  /** 是否注入企业画像上下文 */
  useCompanyProfile?: boolean;
}

export interface SkillResponse {
  ok: boolean;
  
  /** AI 结构化输出 */
  output: Record<string, unknown>;
  
  /** AI 引用的 Evidence */
  references: Array<{
    evidenceId: string;
    title: string;
    why: string;
  }>;
  
  /** 置信度 0-1 */
  confidence: number;
  
  /** 待确认问题（自动转 Task） */
  openQuestions: string[];
  
  /** 缺少证据的声明（自动转 urgent Task） */
  missingProof: string[];
  
  /** 假设列表 */
  assumptions: string[];
  
  /** 推荐的后续 Skill */
  suggestedNextSkills: string[];
  
  /** 新创建的 ArtifactVersion ID */
  versionId: string;
  
  /** 自动创建的 Task IDs */
  taskIds: string[];
}

// ==================== AI Output Common Schema ====================

/** 所有 Skill AI 输出必须包含的通用字段 */
export const skillOutputCommonSchema = z.object({
  confidence: z.number().min(0).max(1),
  openQuestions: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  evidenceIds: z.array(z.string()).default([]),
  suggestedNextSkills: z.array(z.string()).default([]),
});

export type SkillOutputCommon = z.infer<typeof skillOutputCommonSchema>;

/** 通用输出 Prompt 后缀（注入到所有 Skill 的 system prompt） */
export const COMMON_OUTPUT_INSTRUCTIONS = `
你的输出必须是严格的 JSON 格式，并且必须包含以下通用字段：
- confidence: 0-1 的数字，表示你对输出的置信度
- openQuestions: 字符串数组，列出需要人工确认的问题
- assumptions: 字符串数组，列出你做出的假设（缺乏明确证据时）
- evidenceIds: 字符串数组，列出你引用的证据 ID（使用 [E1] 格式引用时，这里填入对应的 cuid）
- suggestedNextSkills: 字符串数组，建议接下来执行的 Skill 名称

重要约束：
1. 所有关键主张必须引用证据，使用 [E1]、[E2] 等格式标注
2. 不得编造事实或数据，缺乏证据时标记为 assumption
3. 输出必须是可直接 JSON.parse 的格式，不要包含 markdown code fence
`;

// ==================== Error Types ====================

export class SkillNotFoundError extends Error {
  constructor(skillName: string) {
    super(`Skill not found: ${skillName}`);
    this.name = 'SkillNotFoundError';
  }
}

export class SkillInputValidationError extends Error {
  constructor(skillName: string, details: string) {
    super(`Input validation failed for ${skillName}: ${details}`);
    this.name = 'SkillInputValidationError';
  }
}

export class SkillOutputParseError extends Error {
  rawOutput: string;
  
  constructor(skillName: string, rawOutput: string) {
    super(`Failed to parse AI output for ${skillName}`);
    this.name = 'SkillOutputParseError';
    this.rawOutput = rawOutput;
  }
}
