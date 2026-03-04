"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  type ArtifactVersionData,
  type ArtifactStatusValue,
  type ArtifactVersionMeta,
  type EntityType,
  isValidTransition,
} from "@/types/artifact";

// ==================== 认证辅助 ====================

async function getSession() {
  const session = await auth();
  if (!session?.user?.tenantId || !session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}

// ==================== 数据转换 ====================

function toVersionData(
  v: {
    id: string;
    tenantId: string;
    entityType: string;
    entityId: string;
    version: number;
    status: string;
    content: unknown;
    meta: unknown;
    createdById: string;
    createdAt: Date;
    createdBy?: { name: string | null } | null;
  }
): ArtifactVersionData {
  return {
    id: v.id,
    tenantId: v.tenantId,
    entityType: v.entityType as EntityType,
    entityId: v.entityId,
    version: v.version,
    status: v.status as ArtifactStatusValue,
    content: v.content as Record<string, unknown>,
    meta: v.meta as ArtifactVersionMeta,
    createdById: v.createdById,
    createdByName: v.createdBy?.name || undefined,
    createdAt: v.createdAt,
  };
}

// ==================== 创建版本 ====================

export async function createVersion(
  entityType: EntityType,
  entityId: string,
  content: Record<string, unknown>,
  meta?: { changeNote?: string; generatedBy?: "ai" | "human" }
): Promise<ArtifactVersionData> {
  const session = await getSession();

  // 获取当前最大版本号
  const latestVersion = await prisma.artifactVersion.findFirst({
    where: {
      tenantId: session.user.tenantId,
      entityType,
      entityId,
    },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  const newVersionNumber = (latestVersion?.version ?? 0) + 1;

  const version = await prisma.artifactVersion.create({
    data: {
      tenantId: session.user.tenantId,
      entityType,
      entityId,
      version: newVersionNumber,
      status: "draft",
      content: content as object,
      meta: (meta ?? {}) as object,
      createdById: session.user.id,
    },
    include: {
      createdBy: { select: { name: true } },
    },
  });

  return toVersionData(version);
}

// ==================== 列出版本历史 ====================

export async function listVersions(
  entityType: EntityType,
  entityId: string
): Promise<ArtifactVersionData[]> {
  const session = await getSession();

  const versions = await prisma.artifactVersion.findMany({
    where: {
      tenantId: session.user.tenantId,
      entityType,
      entityId,
    },
    orderBy: { version: "desc" },
    include: {
      createdBy: { select: { name: true } },
    },
  });

  return versions.map(toVersionData);
}

// ==================== 获取最新版本 ====================

export async function getLatestVersion(
  entityType: EntityType,
  entityId: string
): Promise<ArtifactVersionData | null> {
  const session = await getSession();

  const version = await prisma.artifactVersion.findFirst({
    where: {
      tenantId: session.user.tenantId,
      entityType,
      entityId,
    },
    orderBy: { version: "desc" },
    include: {
      createdBy: { select: { name: true } },
    },
  });

  return version ? toVersionData(version) : null;
}

// ==================== 获取指定版本 ====================

export async function getVersionById(
  versionId: string
): Promise<ArtifactVersionData | null> {
  const session = await getSession();

  const version = await prisma.artifactVersion.findFirst({
    where: {
      id: versionId,
      tenantId: session.user.tenantId,
    },
    include: {
      createdBy: { select: { name: true } },
    },
  });

  return version ? toVersionData(version) : null;
}

// ==================== 更新版本状态 ====================

export async function updateVersionStatus(
  versionId: string,
  newStatus: ArtifactStatusValue
): Promise<ArtifactVersionData> {
  const session = await getSession();

  // 获取当前版本
  const current = await prisma.artifactVersion.findFirst({
    where: {
      id: versionId,
      tenantId: session.user.tenantId,
    },
  });

  if (!current) {
    throw new Error("版本不存在");
  }

  const currentStatus = current.status as ArtifactStatusValue;

  // 验证状态转换
  if (!isValidTransition(currentStatus, newStatus)) {
    throw new Error(
      `无效的状态转换: ${currentStatus} → ${newStatus}`
    );
  }

  const updated = await prisma.artifactVersion.update({
    where: { id: versionId },
    data: { status: newStatus },
    include: {
      createdBy: { select: { name: true } },
    },
  });

  return toVersionData(updated);
}

// ==================== 回滚到指定版本 ====================

export async function revertToVersion(
  versionId: string
): Promise<ArtifactVersionData> {
  const session = await getSession();

  // 获取目标版本
  const targetVersion = await prisma.artifactVersion.findFirst({
    where: {
      id: versionId,
      tenantId: session.user.tenantId,
    },
  });

  if (!targetVersion) {
    throw new Error("目标版本不存在");
  }

  // 获取当前最大版本号
  const latestVersion = await prisma.artifactVersion.findFirst({
    where: {
      tenantId: session.user.tenantId,
      entityType: targetVersion.entityType,
      entityId: targetVersion.entityId,
    },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  const newVersionNumber = (latestVersion?.version ?? 0) + 1;

  // 创建新版本（内容来自目标版本）
  const newVersion = await prisma.artifactVersion.create({
    data: {
      tenantId: session.user.tenantId,
      entityType: targetVersion.entityType,
      entityId: targetVersion.entityId,
      version: newVersionNumber,
      status: "draft",
      content: targetVersion.content as object,
      meta: {
        changeNote: `回滚自版本 ${targetVersion.version}`,
        generatedBy: "human",
      },
      createdById: session.user.id,
    },
    include: {
      createdBy: { select: { name: true } },
    },
  });

  return toVersionData(newVersion);
}

// ==================== 按状态查询版本 ====================

export async function getVersionsByStatus(
  status: ArtifactStatusValue,
  entityType?: EntityType
): Promise<ArtifactVersionData[]> {
  const session = await getSession();

  const versions = await prisma.artifactVersion.findMany({
    where: {
      tenantId: session.user.tenantId,
      status,
      ...(entityType ? { entityType } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
    },
    take: 50,
  });

  return versions.map(toVersionData);
}

// ==================== 获取版本统计 ====================

export async function getVersionStats(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  byEntityType: Record<string, number>;
}> {
  const session = await getSession();

  const [total, byStatus, byEntityType] = await Promise.all([
    prisma.artifactVersion.count({
      where: { tenantId: session.user.tenantId },
    }),
    prisma.artifactVersion.groupBy({
      by: ["status"],
      where: { tenantId: session.user.tenantId },
      _count: true,
    }),
    prisma.artifactVersion.groupBy({
      by: ["entityType"],
      where: { tenantId: session.user.tenantId },
      _count: true,
    }),
  ]);

  return {
    total,
    byStatus: Object.fromEntries(
      byStatus.map((s) => [s.status, s._count])
    ),
    byEntityType: Object.fromEntries(
      byEntityType.map((e) => [e.entityType, e._count])
    ),
  };
}
