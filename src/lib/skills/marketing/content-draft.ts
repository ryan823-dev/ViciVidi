import { z } from 'zod';
import type { SkillDefinition, PromptContext } from '../types';
import { formatEvidenceForPrompt } from '../evidence-loader';
import { SKILL_NAMES } from '../registry';

// ==================== Input/Output Schemas ====================

const inputSchema = z.object({
  brief: z.record(z.string(), z.unknown()).describe('内容简报'),
});

const faqItemSchema = z.object({
  q: z.string(),
  a: z.string(),
  evidenceIds: z.array(z.string()),
});

const warningSchema = z.object({
  type: z.enum(['forbidden_term', 'compliance']),
  detail: z.string(),
  locationHint: z.string(),
});

const outputSchema = z.object({
  contentPiece: z.object({
    title: z.string(),
    metaTitle: z.string(),
    metaDescription: z.string(),
    slug: z.string(),
    bodyMarkdown: z.string(),
    faq: z.array(faqItemSchema),
    schemaJson: z.record(z.string(), z.unknown()),
    evidenceMap: z.array(z.object({
      label: z.string(),
      evidenceId: z.string(),
      why: z.string(),
    })),
    warnings: z.array(warningSchema),
  }),
});

// ==================== Skill Definition ====================

export const contentDraftSkill: SkillDefinition<typeof inputSchema, typeof outputSchema> = {
  name: SKILL_NAMES.MARKETING_GENERATE_CONTENT_DRAFT,
  displayName: '生成内容初稿',
  engine: 'marketing',
  outputEntityType: 'ContentDraft',
  inputSchema,
  outputSchema,
  suggestedNextSkills: [
    SKILL_NAMES.MARKETING_VERIFY_CLAIMS,
    SKILL_NAMES.MARKETING_BUILD_PUBLISH_PACK,
  ],
  model: 'qwen-max',
  temperature: 0.5,
  
  systemPrompt: `你是资深B2B英文内容写作与SEO编辑。根据Brief生成内容初稿。

要求：
1. 文中所有关键主张用[E1]/[E2]标注证据
2. 不夸大、不写无法证明的数字
3. 结构符合SEO：清晰H2/H3，段落短，包含FAQ
4. 同时输出"禁词/合规命中列表"（仅提示不自动改写）
5. 内容长度 800-1500 字
6. 关键词密度 1-2%`,
  
  buildUserPrompt: (ctx: PromptContext) => {
    const { input, evidences } = ctx;
    
    let prompt = '';
    
    if (evidences?.length) {
      prompt += formatEvidenceForPrompt(evidences);
    }
    
    prompt += `
=== Brief ===
${JSON.stringify(input.brief, null, 2)}

=== 任务要求 ===
请根据以上 Brief 生成内容初稿，使用 Markdown 格式。所有关键主张必须用 [E1]/[E2] 标注引用的证据。`;
    
    return prompt;
  },
};
