import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { executeSkill } from '@/lib/skills/runner';
import { hasSkill, ensureSkillsRegistered } from '@/lib/skills/registry';
import {
  SkillNotFoundError,
  SkillInputValidationError,
  SkillOutputParseError,
} from '@/lib/skills/types';
import type { SkillRequest } from '@/lib/skills/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ skillName: string }> }
) {
  try {
    // 1. 认证
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { tenantId, id: userId } = session.user;
    const { skillName } = await params;
    
    // 2. 确保 Skills 已注册
    await ensureSkillsRegistered();
    
    // 3. 检查 Skill 是否存在
    if (!hasSkill(skillName)) {
      return NextResponse.json(
        { ok: false, error: `Skill not found: ${skillName}` },
        { status: 404 }
      );
    }
    
    // 4. 解析请求体
    const body = await request.json();
    
    // 5. 基础字段验证
    if (!body.entityType || !body.entityId) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: entityType, entityId' },
        { status: 400 }
      );
    }
    
    // 6. 构建 SkillRequest
    const skillRequest: SkillRequest = {
      entityType: body.entityType,
      entityId: body.entityId,
      artifactVersionId: body.artifactVersionId,
      input: body.input || {},
      mode: body.mode || 'generate',
      evidenceIds: body.evidenceIds,
      useCompanyProfile: body.useCompanyProfile ?? true,
    };
    
    // 7. 执行 Skill
    const result = await executeSkill(skillName, skillRequest, {
      tenantId,
      userId,
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[API] Skill execution error:', error);
    
    // 错误类型映射
    if (error instanceof SkillNotFoundError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 404 }
      );
    }
    
    if (error instanceof SkillInputValidationError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }
    
    if (error instanceof SkillOutputParseError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          rawOutput: error.rawOutput,
        },
        { status: 422 }
      );
    }
    
    // 通用错误
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// GET 方法：获取 Skill 信息
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ skillName: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await ensureSkillsRegistered();
    
    const { skillName } = await params;
    const { getSkill } = await import('@/lib/skills/registry');
    const skill = getSkill(skillName);
    
    if (!skill) {
      return NextResponse.json(
        { ok: false, error: `Skill not found: ${skillName}` },
        { status: 404 }
      );
    }
    
    // 返回 Skill 元信息（不含 prompt）
    return NextResponse.json({
      ok: true,
      skill: {
        name: skill.name,
        displayName: skill.displayName,
        engine: skill.engine,
        outputEntityType: skill.outputEntityType,
        suggestedNextSkills: skill.suggestedNextSkills,
      },
    });
    
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
