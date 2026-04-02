/**
 * 企业背调 API 路由
 * POST /api/leads/[id]/due-diligence
 * 触发背调并返回聚合数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { gatherDueDiligence } from '@/lib/due-diligence';

const CREDIT_COST = 40; // 背调消耗 40 credits

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;

    // 1. 验证用户认证
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '请先登录' },
        { status: 401 }
      );
    }

    // 2. 获取用户角色和租户
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, role_id, role:roles(name), tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found', message: '用户不存在' },
        { status: 404 }
      );
    }

    // 检查用户角色
    const roleName = userData.role?.name;
    if (roleName !== 'admin' && roleName !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden', message: '需要管理员权限执行背调' },
        { status: 403 }
      );
    }

    const tenantId = userData.tenant_id;

    // 3. 获取 Lead 信息
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found', message: '线索不存在' },
        { status: 404 }
      );
    }

    // 4. 检查租户 credits
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, settings')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found', message: '租户不存在' },
        { status: 404 }
      );
    }

    const tenantSettings = tenant.settings as Record<string, any> || {};
    const currentCredits = tenantSettings.credits || 0;

    if (currentCredits < CREDIT_COST) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          message: `背调需要 ${CREDIT_COST} credits，当前余额 ${currentCredits}`,
          required: CREDIT_COST,
          current: currentCredits,
        },
        { status: 402 }
      );
    }

    // 5. 检查是否有进行中的背调
    const { data: existingDueDiligence } = await supabase
      .from('lead_due_diligences')
      .select('id, status, created_at')
      .eq('lead_id', leadId)
      .eq('status', 'processing')
      .single();

    if (existingDueDiligence) {
      return NextResponse.json(
        { error: 'Due diligence in progress', message: '背调正在进行中，请稍后查看结果' },
        { status: 409 }
      );
    }

    // 6. 创建背调记录
    const { data: dueDiligence, error: createError } = await supabase
      .from('lead_due_diligences')
      .insert({
        lead_id: leadId,
        tenant_id: tenantId,
        status: 'processing',
        credit_cost: CREDIT_COST,
        sources: [],
        triggered_by_id: user.id,
        triggered_by_email: user.email,
      })
      .select()
      .single();

    if (createError || !dueDiligence) {
      return NextResponse.json(
        { error: 'Failed to create due diligence record', message: '创建背调记录失败' },
        { status: 500 }
      );
    }

    // 7. 执行背调数据聚合（异步）
    // 注意: 实际生产环境中应该使用队列处理
    try {
      const companyName = lead.company_name || lead.research_data?.companyName || '';
      const domain = lead.website || lead.research_data?.domain;

      if (!companyName) {
        // 更新状态为失败
        await supabase
          .from('lead_due_diligences')
          .update({
            status: 'failed',
            error_message: '缺少公司名称',
          })
          .eq('id', dueDiligence.id);

        return NextResponse.json(
          { error: 'Missing company name', message: '线索缺少公司名称' },
          { status: 400 }
        );
      }

      // 执行背调数据聚合
      const dueDiligenceData = await gatherDueDiligence(companyName, domain);

      // 扣除 credits
      const newCredits = currentCredits - CREDIT_COST;
      await supabase
        .from('tenants')
        .update({
          settings: {
            ...tenantSettings,
            credits: newCredits,
            creditHistory: [
              ...(tenantSettings.creditHistory || []),
              {
                type: 'due_diligence',
                amount: -CREDIT_COST,
                balance: newCredits,
                leadId,
                timestamp: new Date().toISOString(),
              },
            ],
          },
        })
        .eq('id', tenantId);

      // 更新背调记录
      await supabase
        .from('lead_due_diligences')
        .update({
          status: 'completed',
          sources: dueDiligenceData.sources,
          summary: dueDiligenceData.summary?.text,
          confidence: dueDiligenceData.summary?.confidence,
          crunchbase_data: dueDiligenceData.crunchbase?.data || null,
          linkedin_data: dueDiligenceData.linkedin?.data || null,
          news_articles: dueDiligenceData.news?.articles || null,
          raw_responses: {
            crunchbase: dueDiligenceData.crunchbase,
            linkedin: dueDiligenceData.linkedin,
            news: dueDiligenceData.news,
          },
          completed_at: new Date().toISOString(),
        })
        .eq('id', dueDiligence.id);

      return NextResponse.json({
        success: true,
        dueDiligence: {
          id: dueDiligence.id,
          status: 'completed',
          data: dueDiligenceData,
          creditCost: CREDIT_COST,
          remainingCredits: newCredits,
        },
      });

    } catch (ddError: any) {
      // 背调执行失败
      await supabase
        .from('lead_due_diligences')
        .update({
          status: 'failed',
          error_message: ddError.message || '背调执行失败',
        })
        .eq('id', dueDiligence.id);

      return NextResponse.json(
        { error: 'Due diligence failed', message: ddError.message || '背调执行失败' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[Due Diligence API] Error:', error);
    return NextResponse.json(
      { error: 'Internal error', message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leads/[id]/due-diligence
 * 获取背调结果
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;

    // 验证用户认证
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 获取最新的背调记录
    const { data: dueDiligence, error } = await supabase
      .from('lead_due_diligences')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !dueDiligence) {
      return NextResponse.json(
        { error: 'Due diligence not found', message: '暂无背调记录' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      dueDiligence: {
        id: dueDiligence.id,
        status: dueDiligence.status,
        summary: dueDiligence.summary,
        confidence: dueDiligence.confidence,
        sources: dueDiligence.sources,
        crunchbaseData: dueDiligence.crunchbase_data,
        linkedinData: dueDiligence.linkedin_data,
        newsArticles: dueDiligence.news_articles,
        errorMessage: dueDiligence.error_message,
        creditCost: dueDiligence.credit_cost,
        triggeredBy: dueDiligence.triggered_by_email,
        createdAt: dueDiligence.created_at,
        completedAt: dueDiligence.completed_at,
      },
    });

  } catch (error) {
    console.error('[Due Diligence GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}
