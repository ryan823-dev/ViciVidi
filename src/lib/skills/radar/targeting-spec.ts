import { z } from 'zod';
import type { SkillDefinition, PromptContext } from '../types';
import { formatEvidenceForPrompt, formatCompanyProfileForPrompt } from '../evidence-loader';
import { SKILL_NAMES } from '../registry';

// ==================== Input/Output Schemas ====================

const inputSchema = z.object({
  icpName: z.string().optional().describe('ICP 名称'),
  focusIndustries: z.array(z.string()).optional().describe('重点关注的行业'),
  focusRegions: z.array(z.string()).optional().describe('重点关注的区域'),
});

const segmentSchema = z.object({
  segmentName: z.string(),
  firmographic: z.object({
    industries: z.array(z.string()),
    countries: z.array(z.string()),
    companySize: z.object({
      min: z.number().nullable(),
      max: z.number().nullable(),
    }),
    exclude: z.array(z.string()),
  }),
  technographic: z.object({
    keywords: z.array(z.string()),
    standards: z.array(z.string()),
    systems: z.array(z.string()),
    exclude: z.array(z.string()),
  }),
  useCases: z.array(z.object({
    name: z.string(),
    signals: z.array(z.string()),
    excludeSignals: z.array(z.string()),
  })),
  triggers: z.array(z.object({
    name: z.string(),
    signals: z.array(z.string()),
    whereToObserve: z.array(z.string()),
    confidence: z.number(),
  })),
  exclusionRules: z.array(z.object({
    rule: z.string(),
    why: z.string(),
  })),
  decisionUnit: z.object({
    roles: z.array(z.object({
      role: z.string(),
      kpi: z.array(z.string()),
      typicalTitleKeywords: z.array(z.string()),
    })),
  }),
  successCriteria: z.array(z.object({
    metric: z.string(),
    direction: z.enum(['increase', 'decrease']),
    typicalRange: z.string(),
  })),
  evidenceIds: z.array(z.string()),
});

const outputSchema = z.object({
  targetingSpec: z.object({
    icpName: z.string(),
    segments: z.array(segmentSchema),
    assumptions: z.array(z.string()),
    openQuestions: z.array(z.string()),
  }),
});

// ==================== Skill Definition ====================

export const targetingSpecSkill: SkillDefinition<typeof inputSchema, typeof outputSchema> = {
  name: SKILL_NAMES.RADAR_BUILD_TARGETING_SPEC,
  displayName: '生成 Targeting Spec',
  engine: 'radar',
  outputEntityType: 'TargetingSpec',
  inputSchema,
  outputSchema,
  suggestedNextSkills: [
    SKILL_NAMES.RADAR_BUILD_CHANNEL_MAP,
    SKILL_NAMES.RADAR_PLAN_ACCOUNT_DISCOVERY,
  ],
  model: 'qwen-max',
  temperature: 0.3,
  
  systemPrompt: `你是B2B出海获客专家。根据输入的企业认知、产品、优势证据、ICP/Persona与触发事件，产出"可执行筛选规则 Targeting Spec"。

要求：
1. 规则必须可落地（能用于筛选公司/联系人），并明确排除条件
2. 不得编造事实；所有关键判断必须引用证据ID或标为假设
3. 输出的 segments 至少包含 1 个细分市场
4. 每个 segment 必须包含完整的筛选条件和排除规则`,
  
  buildUserPrompt: (ctx: PromptContext) => {
    const { input, companyProfile, evidences } = ctx;
    
    let prompt = '';
    
    // 企业画像上下文
    if (companyProfile) {
      prompt += formatCompanyProfileForPrompt(companyProfile);
    }
    
    // 证据上下文
    if (evidences?.length) {
      prompt += formatEvidenceForPrompt(evidences);
    }
    
    // 用户输入
    prompt += `
=== 任务要求 ===
请基于以上企业认知和证据，生成可执行的 Targeting Spec。

${input.icpName ? `ICP 名称：${input.icpName}` : ''}
${input.focusIndustries ? `重点行业：${(input.focusIndustries as string[]).join('、')}` : ''}
${input.focusRegions ? `重点区域：${(input.focusRegions as string[]).join('、')}` : ''}

请输出严格的 JSON 格式，包含 targetingSpec 对象。`;
    
    return prompt;
  },
};
