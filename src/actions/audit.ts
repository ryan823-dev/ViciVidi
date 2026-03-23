"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function getSession() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createAudit(url: string) {
  const session = await getSession();

  // Basic URL validation
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Only HTTP/HTTPS URLs are supported");
    }
  } catch (error) {
    console.error('[createSeoAudit] URL validation error:', error);
    throw new Error("Invalid URL format");
  }

  const audit = await db.seoAudit.create({
    data: {
      tenantId: session.user.tenantId,
      userId: session.user.id,
      targetUrl: url,
      status: "pending",
      progress: 0,
    },
  });

  revalidatePath("/zh-CN/seo/planner");
  revalidatePath("/en/seo/planner");
  return audit;
}

export async function getAudit(id: string) {
  const session = await getSession();
  return db.seoAudit.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });
}

export async function getAudits() {
  const session = await getSession();
  return db.seoAudit.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      targetUrl: true,
      status: true,
      progress: true,
      scores: true,
      pagesCrawled: true,
      crawlDuration: true,
      createdAt: true,
      completedAt: true,
    },
  });
}

export async function getAuditProgress(id: string) {
  const session = await getSession();
  const audit = await db.seoAudit.findFirst({
    where: { id, tenantId: session.user.tenantId },
    select: {
      status: true,
      progress: true,
      currentStep: true,
    },
  });
  if (!audit) throw new Error("Audit not found");
  return audit;
}

export async function deleteAudit(id: string) {
  const session = await getSession();
  await db.seoAudit.deleteMany({
    where: { id, tenantId: session.user.tenantId },
  });
  revalidatePath("/zh-CN/seo/planner");
  revalidatePath("/en/seo/planner");
}
