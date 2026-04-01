"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  actionUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
};

// ===================== Fetch unread count =====================

export async function getUnreadCount(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) return 0;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true },
  });
  if (!user?.tenantId) return 0;

  try {
    const count = await (prisma as unknown as Record<string, { count: (args: unknown) => Promise<number> }>).notification.count({
      where: { tenantId: user.tenantId, readAt: null },
    });
    return count;
  } catch {
    return 0;
  }
}

// ===================== Fetch notifications =====================

export async function getNotifications(limit = 20): Promise<NotificationItem[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true },
  });
  if (!user?.tenantId) return [];

  try {
    const rows = await (prisma as unknown as Record<string, { findMany: (args: unknown) => Promise<NotificationItem[]> }>).notification.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows;
  } catch {
    return [];
  }
}

// ===================== Mark as read =====================

export async function markNotificationRead(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  try {
    await (prisma as unknown as Record<string, { update: (args: unknown) => Promise<unknown> }>).notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    revalidatePath("/customer", "layout");
  } catch {
    // no-op if model not yet migrated
  }
}

export async function markAllRead(tenantId: string): Promise<void> {
  try {
    await (prisma as unknown as Record<string, { updateMany: (args: unknown) => Promise<unknown> }>).notification.updateMany({
      where: { tenantId, readAt: null },
      data: { readAt: new Date() },
    });
    revalidatePath("/customer", "layout");
  } catch {
    // no-op
  }
}

// ===================== Create notification (server-side helper) =====================

export async function createNotification(params: {
  tenantId: string;
  type: string;
  title: string;
  body: string;
  actionUrl?: string;
}): Promise<void> {
  try {
    await (prisma as unknown as Record<string, { create: (args: unknown) => Promise<unknown> }>).notification.create({
      data: {
        tenantId: params.tenantId,
        type: params.type,
        title: params.title,
        body: params.body,
        actionUrl: params.actionUrl ?? null,
      },
    });
  } catch {
    // no-op if model not yet migrated
  }
}
