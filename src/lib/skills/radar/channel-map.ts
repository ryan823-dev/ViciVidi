import { z } from 'zod';
import type { SkillDefinition, PromptContext } from '../types';
import { formatEvidenceForPrompt } from '../evidence-loader';
import { SKILL_NAMES } from '../registry';

// ==================== Input/Output Schemas ====================

const inputSchema = z.object({
  targetingSpec: z.record(z.string(), z.unknown()).describe('已生成的 Targeting Spec'),
  personaName: z.string().optional().describe('目标 Persona 名称'),
});

const channelSchema = z.object({
  channelType: z.enum([
    'directory', 'association', 'procurement', 'tradeshow',
    'linkedin', 'search', 'ecosystem', 'hiring'
  ]),
  name: z.string(),
  discoveryMethod: z.object({
    searchQueries: z.array(z.string()),
    filters: z.array(z.string()),
    signalsToLookFor: z.array(z.string()),
  }),
  expectedYield: z.enum(['low', 'medium', 'high']),
  dataToCapture: z.array(z.string()),
  complianceNotes: z.array(z.string()),
});

const outputSchema = z.object({
  channelMap: z.object({
    forSegment: z.string(),
    forPersona: z.string(),
    channels: z.array(channelSchema),
    evidenceIds: z.array(z.string()),
    assumptions: z.array(z.string()),
    openQuestions: z.array(z.string()),
  }),
});

// ==================== Skill Definition ====================

export const channelMapSkill: SkillDefinition<typeof inputSchema, typeof outputSchema> = {
  name: SKILL_NAMES.RADAR_BUILD_CHANNEL_MAP,
  displayName: '生成渠道地图',
  engine: 'radar',
  outputEntityType: 'ChannelMap',
  inputSchema,
  outputSchema,
  suggestedNextSkills: [
    SKILL_NAMES.RADAR_PLAN_ACCOUNT_DISCOVERY,
  ],
  model: 'qwen-plus',
  temperature: 0.3,
  
  systemPrompt: `你是B2B获客研究负责人。基于Targeting Spec与Persona，生成"渠道地图 Channel Map"，用于持续发现目标公司与联系人。

要求：
1. 必须覆盖 directory/association/procurement/tradeshow/linkedin/search/ecosystem/hiring 至少6类渠道
2. 每条渠道必须给出"可执行发现方法"：搜索字符串/筛选路径/观察信号/预期产出等级
3. 注明合规注意事项（避免批量抓取、优先公开信息、保留来源链接）
4. 不得输出无法执行的空话`,
  
  buildUserPrompt: (ctx: PromptContext) => {
    const { input, evidences } = ctx;
    
    let prompt = '';
    
    if (evidences?.length) {
      prompt += formatEvidenceForPrompt(evidences);
    }
    
    prompt += `
=== 输入数据 ===
Targeting Spec: ${JSON.stringify(input.targetingSpec, null, 2)}
${input.personaName ? `目标 Persona: ${input.personaName}` : ''}

=== 任务要求 ===
请基于以上 Targeting Spec，生成可执行的渠道地图。每个渠道必须包含具体的搜索方法和预期产出。`;
    
    return prompt;
  },
};
