import { z } from 'zod';
import type { SkillDefinition, PromptContext } from '../types';
import { SKILL_NAMES } from '../registry';

// ==================== Input/Output Schemas ====================

const inputSchema = z.object({
  targetingSpec: z.record(z.string(), z.unknown()).describe('Targeting Spec'),
  rawAccounts: z.array(z.object({
    companyName: z.string(),
    website: z.string().optional(),
    sourceUrl: z.string().optional(),
    whyMatch: z.string().optional(),
  })).describe('待合格化的公司列表'),
});

const qualifiedAccountSchema = z.object({
  companyName: z.string(),
  website: z.string(),
  matchReasons: z.array(z.string()),
  exclude: z.boolean(),
  exclusionReason: z.string().nullable(),
  tier: z.enum(['A', 'B', 'C']),
  dataGaps: z.array(z.string()),
  source: z.object({
    sourceUrl: z.string(),
    channelType: z.string(),
  }),
  confidence: z.number(),
});

const rejectedAccountSchema = z.object({
  companyName: z.string(),
  website: z.string(),
  exclusionReason: z.string(),
  sourceUrl: z.string(),
});

const outputSchema = z.object({
  qualified: z.array(qualifiedAccountSchema),
  rejected: z.array(rejectedAccountSchema),
});

// ==================== Skill Definition ====================

export const qualifyAccountsSkill: SkillDefinition<typeof inputSchema, typeof outputSchema> = {
  name: SKILL_NAMES.RADAR_QUALIFY_ACCOUNTS,
  displayName: '合格化名单',
  engine: 'radar',
  outputEntityType: 'AccountList',
  inputSchema,
  outputSchema,
  suggestedNextSkills: [
    SKILL_NAMES.RADAR_BUILD_CONTACT_ROLE_MAP,
    SKILL_NAMES.RADAR_GENERATE_OUTREACH_PACK,
  ],
  model: 'qwen-plus',
  temperature: 0.2,
  
  systemPrompt: `你是B2B线索质量审核官。根据Targeting Spec对输入公司列表做合格化：

要求：
1. 去重（同域名/同官网视为同一公司）
2. 校验匹配（命中哪些规则/触发信号）
3. 标注排除原因（若不符合）
4. 输出分层建议（Tier A/B/C）与下一步需要补全的信息
5. 对每条记录给出置信度评分`,
  
  buildUserPrompt: (ctx: PromptContext) => {
    const { input } = ctx;
    
    return `
=== Targeting Spec ===
${JSON.stringify(input.targetingSpec, null, 2)}

=== 待合格化的公司列表 ===
${JSON.stringify(input.rawAccounts, null, 2)}

=== 任务要求 ===
请对以上公司列表进行合格化审核，输出 qualified（合格）和 rejected（排除）两个数组。`;
  },
};
