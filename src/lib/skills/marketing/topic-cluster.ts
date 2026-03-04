import { z } from 'zod';
import type { SkillDefinition, PromptContext } from '../types';
import { formatEvidenceForPrompt, formatCompanyProfileForPrompt } from '../evidence-loader';
import { SKILL_NAMES } from '../registry';

// ==================== Input/Output Schemas ====================

const inputSchema = z.object({
  profiles: z.record(z.string(), z.unknown()).optional().describe('ICP/Persona 数据'),
  advantages: z.array(z.string()).optional().describe('企业优势列表'),
});

const topicSchema = z.object({
  title: z.string(),
  funnel: z.enum(['TOFU', 'MOFU', 'BOFU']),
  intent: z.enum(['informational', 'commercial', 'transactional']),
  questions: z.array(z.string()),
  outline: z.array(z.string()),
  requiredEvidenceIds: z.array(z.string()),
  cta: z.string(),
});

const aeoQuestionSchema = z.object({
  q: z.string(),
  aKeyPoints: z.array(z.string()),
  evidenceIds: z.array(z.string()),
  assumption: z.boolean(),
});

const outputSchema = z.object({
  topicCluster: z.object({
    name: z.string(),
    topics: z.array(topicSchema),
    aeoQuestions: z.array(aeoQuestionSchema),
  }),
});

// ==================== Skill Definition ====================

export const topicClusterSkill: SkillDefinition<typeof inputSchema, typeof outputSchema> = {
  name: SKILL_NAMES.MARKETING_BUILD_TOPIC_CLUSTER,
  displayName: '生成主题集群',
  engine: 'marketing',
  outputEntityType: 'TopicCluster',
  inputSchema,
  outputSchema,
  suggestedNextSkills: [
    SKILL_NAMES.MARKETING_GENERATE_CONTENT_BRIEF,
  ],
  model: 'qwen-max',
  temperature: 0.4,
  
  systemPrompt: `你是SEO/AEO内容策略师。根据ICP/Persona/Triggers与优势证据，生成Topic Cluster。

要求：
1. 每个主题包含：搜索意图、核心问题、推荐结构(H2/H3)、必须引用的Evidence、CTA建议
2. 必须覆盖 TOFU/MOFU/BOFU 三个漏斗阶段
3. AEO问题集：给出10-20个"用户会问"的问题与简短答案要点
4. 答案要点需标注Evidence或标记为假设`,
  
  buildUserPrompt: (ctx: PromptContext) => {
    const { input, companyProfile, evidences } = ctx;
    
    let prompt = '';
    
    if (companyProfile) {
      prompt += formatCompanyProfileForPrompt(companyProfile);
    }
    
    if (evidences?.length) {
      prompt += formatEvidenceForPrompt(evidences);
    }
    
    prompt += `
${input.profiles ? `=== ICP/Persona 数据 ===\n${JSON.stringify(input.profiles, null, 2)}` : ''}

${input.advantages ? `=== 企业优势 ===\n${(input.advantages as string[]).join('\n')}` : ''}

=== 任务要求 ===
请生成主题集群，包含 TOFU/MOFU/BOFU 各阶段的主题，以及 AEO 问题集。`;
    
    return prompt;
  },
};
