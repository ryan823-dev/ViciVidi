/**
 * Cron: 定时帖子发布
 * 每小时运行，找出 scheduledAt <= now 的 scheduled 状态帖子并发布
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publishSocialPost } from '@/actions/social';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // 查找所有已到期的定时帖子
  const duePosts = await prisma.socialPost.findMany({
    where: {
      status: 'scheduled',
      scheduledAt: { lte: now },
    },
    select: { id: true, title: true },
  });

  if (duePosts.length === 0) {
    return NextResponse.json({ published: 0, message: 'No due posts' });
  }

  const results: { id: string; success: boolean; error?: string }[] = [];

  for (const post of duePosts) {
    try {
      await publishSocialPost(post.id);
      results.push({ id: post.id, success: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[social-publish] Failed to publish post ${post.id}:`, msg);
      // 标记为失败
      await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: 'failed' },
      }).catch(() => {});
      results.push({ id: post.id, success: false, error: msg });
    }
  }

  const published = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return NextResponse.json({
    published,
    failed,
    total: duePosts.length,
    results,
  });
}
