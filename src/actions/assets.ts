"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  generateStorageKey,
  generatePresignedPutUrl,
  generatePresignedGetUrl,
  getThumbnailUrl,
  deleteObjects,
} from "@/lib/oss";
import {
  detectFileCategory,
  formatFileSize,
  getFileExtension,
} from "@/lib/utils/file-utils";
import type {
  FileUploadInput,
  AssetUploadSession,
  AssetFilters,
  AssetPagination,
  AssetSort,
  AssetListResponse,
  AssetWithFolder,
  AssetWithUrls,
  AssetStats,
  CreateFolderInput,
  UpdateFolderInput,
  UpdateAssetInput,
  AssetMetadata,
  FolderTree,
  FileCategory,
  AssetPurpose,
} from "@/types/assets";

// ==================== 认证辅助 ====================

async function getSession() {
  const session = await auth();
  if (!session?.user?.tenantId || !session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}

// ==================== 上传流程 ====================

/**
 * 创建上传会话（批量）
 * 为每个文件创建 Asset 记录并生成预签名上传 URL
 */
export async function createAssetUploadSession(
  files: FileUploadInput[]
): Promise<AssetUploadSession[]> {
  const session = await getSession();
  const tenantId = session.user.tenantId;
  const userId = session.user.id;

  const results: AssetUploadSession[] = [];

  for (const file of files) {
    // 生成存储路径
    const storageKey = generateStorageKey(tenantId, file.originalName);
    const extension = getFileExtension(file.originalName);
    const fileCategory = detectFileCategory(file.mimeType, extension);

    // 创建 Asset 记录
    const asset = await db.asset.create({
      data: {
        tenantId,
        uploadedById: userId,
        folderId: file.folderId || null,
        originalName: file.originalName,
        storageKey,
        mimeType: file.mimeType,
        fileSize: BigInt(file.fileSize),
        extension,
        fileCategory,
        purpose: [],
        tags: [],
        title: file.originalName,
        status: "uploading",
      },
    });

    // 生成预签名上传 URL
    const presignedUrl = await generatePresignedPutUrl(
      storageKey,
      file.mimeType,
      file.fileSize
    );

    results.push({
      assetId: asset.id,
      presignedUrl,
      storageKey,
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1 小时后过期
    });
  }

  return results;
}

/**
 * 确认上传完成
 */
export async function confirmAssetUpload(
  assetId: string,
  metadata?: AssetMetadata
): Promise<AssetWithFolder> {
  const session = await getSession();

  const asset = await db.asset.update({
    where: {
      id: assetId,
      tenantId: session.user.tenantId,
    },
    data: {
      status: "active",
      metadata: (metadata || {}) as object,
    },
    include: {
      folder: true,
      uploadedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  revalidatePath("/zh-CN/assets");
  return asset as AssetWithFolder;
}

/**
 * 中断上传
 */
export async function abortAssetUpload(assetId: string): Promise<void> {
  const session = await getSession();

  await db.asset.update({
    where: {
      id: assetId,
      tenantId: session.user.tenantId,
    },
    data: {
      status: "deleted",
      deletedAt: new Date(),
    },
  });
}

// ==================== 文件夹操作 ====================

/**
 * 获取所有文件夹（树形结构）
 */
export async function getFolders(): Promise<FolderTree> {
  const session = await getSession();

  const folders = await db.assetFolder.findMany({
    where: { tenantId: session.user.tenantId },
    include: {
      children: true,
      _count: {
        select: { assets: true },
      },
    },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  // 获取总资产数
  const totalAssets = await db.asset.count({
    where: {
      tenantId: session.user.tenantId,
      status: "active",
    },
  });

  // 构建树形结构（只返回顶级文件夹，children 已包含）
  const topLevelFolders = folders.filter((f) => !f.parentId);

  return {
    folders: topLevelFolders as FolderTree["folders"],
    totalAssets,
  };
}

/**
 * 创建文件夹
 */
export async function createFolder(
  data: CreateFolderInput
): Promise<FolderTree["folders"][0]> {
  const session = await getSession();

  // 检查同名文件夹
  const existing = await db.assetFolder.findFirst({
    where: {
      tenantId: session.user.tenantId,
      name: data.name,
      parentId: data.parentId || null,
    },
  });

  if (existing) {
    throw new Error("同名文件夹已存在");
  }

  // 检查父文件夹层级（最多 2 层）
  if (data.parentId) {
    const parent = await db.assetFolder.findFirst({
      where: { id: data.parentId, tenantId: session.user.tenantId },
    });
    if (parent?.parentId) {
      throw new Error("文件夹最多支持两级嵌套");
    }
  }

  const folder = await db.assetFolder.create({
    data: {
      tenantId: session.user.tenantId,
      name: data.name,
      parentId: data.parentId || null,
      color: data.color,
      description: data.description,
    },
    include: {
      children: true,
      _count: {
        select: { assets: true },
      },
    },
  });

  revalidatePath("/zh-CN/assets");
  return folder as FolderTree["folders"][0];
}

/**
 * 更新文件夹
 */
export async function updateFolder(
  id: string,
  data: UpdateFolderInput
): Promise<FolderTree["folders"][0]> {
  const session = await getSession();

  const folder = await db.assetFolder.update({
    where: {
      id,
      tenantId: session.user.tenantId,
    },
    data: {
      name: data.name,
      color: data.color,
      description: data.description,
    },
    include: {
      children: true,
      _count: {
        select: { assets: true },
      },
    },
  });

  revalidatePath("/zh-CN/assets");
  return folder as FolderTree["folders"][0];
}

/**
 * 删除文件夹
 */
export async function deleteFolder(id: string): Promise<void> {
  const session = await getSession();

  // 检查是否有子文件夹
  const childCount = await db.assetFolder.count({
    where: { parentId: id, tenantId: session.user.tenantId },
  });

  if (childCount > 0) {
    throw new Error("请先删除子文件夹");
  }

  // 检查是否有资产
  const assetCount = await db.asset.count({
    where: { folderId: id, tenantId: session.user.tenantId, status: "active" },
  });

  if (assetCount > 0) {
    throw new Error("请先移动或删除文件夹中的资产");
  }

  await db.assetFolder.delete({
    where: { id, tenantId: session.user.tenantId },
  });

  revalidatePath("/zh-CN/assets");
}

// ==================== 资产查询 ====================

/**
 * 获取资产列表
 */
export async function getAssets(
  filters: AssetFilters = {},
  pagination: AssetPagination = { page: 1, pageSize: 48 },
  sort: AssetSort = { field: "createdAt", direction: "desc" }
): Promise<AssetListResponse> {
  const session = await getSession();

  // 构建查询条件
  const where: Record<string, unknown> = {
    tenantId: session.user.tenantId,
    status: filters.status || "active",
  };

  // 文件类别筛选
  if (filters.fileCategory) {
    where.fileCategory = filters.fileCategory;
  }

  // 文件夹筛选
  if (filters.folderId !== undefined) {
    where.folderId = filters.folderId;
  }

  // 用途筛选
  if (filters.purpose && filters.purpose.length > 0) {
    where.purpose = { hasSome: filters.purpose };
  }

  // 标签筛选
  if (filters.tags && filters.tags.length > 0) {
    where.tags = { hasSome: filters.tags };
  }

  // 日期筛选
  if (filters.dateFrom || filters.dateTo) {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (filters.dateFrom) {
      dateFilter.gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      dateFilter.lte = filters.dateTo;
    }
    where.createdAt = dateFilter;
  }

  // 搜索
  if (filters.search) {
    where.OR = [
      { originalName: { contains: filters.search, mode: "insensitive" } },
      { title: { contains: filters.search, mode: "insensitive" } },
      { tags: { has: filters.search } },
    ];
  }

  // 计算总数
  const total = await db.asset.count({ where });

  // 查询数据
  const items = await db.asset.findMany({
    where,
    include: {
      folder: true,
      uploadedBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { [sort.field]: sort.direction },
    skip: (pagination.page - 1) * pagination.pageSize,
    take: pagination.pageSize,
  });

  return {
    items: items as AssetWithFolder[],
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.ceil(total / pagination.pageSize),
  };
}

/**
 * 获取单个资产（含访问 URL）
 */
export async function getAsset(id: string): Promise<AssetWithUrls | null> {
  const session = await getSession();

  const asset = await db.asset.findFirst({
    where: {
      id,
      tenantId: session.user.tenantId,
    },
    include: {
      folder: true,
      uploadedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!asset) return null;

  // 生成访问 URL
  const viewUrl = await generatePresignedGetUrl(asset.storageKey);
  const thumbnailUrl = await getThumbnailUrl(
    asset.storageKey,
    asset.fileCategory as FileCategory,
    asset.mimeType
  );

  return {
    ...asset,
    viewUrl,
    thumbnailUrl,
  } as AssetWithUrls;
}

/**
 * 获取资产下载 URL
 */
export async function getAssetDownloadUrl(id: string): Promise<string> {
  const session = await getSession();

  const asset = await db.asset.findFirst({
    where: {
      id,
      tenantId: session.user.tenantId,
    },
  });

  if (!asset) {
    throw new Error("Asset not found");
  }

  // 记录活动日志
  await db.activity.create({
    data: {
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: "download",
      entityType: "asset",
      entityId: id,
      metadata: { fileName: asset.originalName },
    },
  });

  // 生成下载 URL（24 小时有效）
  return generatePresignedGetUrl(asset.storageKey, 24 * 3600);
}

// ==================== 资产更新 ====================

/**
 * 批量生成缩略图 URL
 */
export async function getAssetThumbnailUrls(
  assets: Array<{ id: string; storageKey: string; fileCategory: string; mimeType: string }>
): Promise<Record<string, string | null>> {
  const urls: Record<string, string | null> = {};
  
  for (const asset of assets) {
    urls[asset.id] = await getThumbnailUrl(
      asset.storageKey,
      asset.fileCategory as FileCategory,
      asset.mimeType
    );
  }
  
  return urls;
}

/**
 * 更新资产
 */
export async function updateAsset(
  id: string,
  data: UpdateAssetInput
): Promise<AssetWithFolder> {
  const session = await getSession();

  const asset = await db.asset.update({
    where: {
      id,
      tenantId: session.user.tenantId,
    },
    data: {
      title: data.title,
      description: data.description,
      tags: data.tags,
      purpose: data.purpose,
      folderId: data.folderId,
    },
    include: {
      folder: true,
      uploadedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  revalidatePath("/zh-CN/assets");
  return asset as AssetWithFolder;
}

/**
 * 软删除资产
 */
export async function deleteAssets(ids: string[]): Promise<void> {
  const session = await getSession();

  await db.asset.updateMany({
    where: {
      id: { in: ids },
      tenantId: session.user.tenantId,
    },
    data: {
      status: "deleted",
      deletedAt: new Date(),
    },
  });

  revalidatePath("/zh-CN/assets");
}

/**
 * 批量移动资产到文件夹
 */
export async function moveAssets(
  ids: string[],
  targetFolderId: string | null
): Promise<void> {
  const session = await getSession();

  // 验证目标文件夹存在
  if (targetFolderId) {
    const folder = await db.assetFolder.findFirst({
      where: { id: targetFolderId, tenantId: session.user.tenantId },
    });
    if (!folder) {
      throw new Error("目标文件夹不存在");
    }
  }

  await db.asset.updateMany({
    where: {
      id: { in: ids },
      tenantId: session.user.tenantId,
    },
    data: {
      folderId: targetFolderId,
    },
  });

  revalidatePath("/zh-CN/assets");
}

/**
 * 批量更新资产用途
 */
export async function updateAssetsPurpose(
  ids: string[],
  purpose: AssetPurpose[]
): Promise<void> {
  const session = await getSession();

  await db.asset.updateMany({
    where: {
      id: { in: ids },
      tenantId: session.user.tenantId,
    },
    data: {
      purpose,
    },
  });

  revalidatePath("/zh-CN/assets");
}

/**
 * 批量添加标签
 */
export async function addTagsToAssets(
  ids: string[],
  newTags: string[]
): Promise<void> {
  const session = await getSession();

  // 需要逐个更新以合并现有标签
  const assets = await db.asset.findMany({
    where: {
      id: { in: ids },
      tenantId: session.user.tenantId,
    },
    select: { id: true, tags: true },
  });

  for (const asset of assets) {
    const mergedTags = [...new Set([...asset.tags, ...newTags])];
    await db.asset.update({
      where: { id: asset.id },
      data: { tags: mergedTags },
    });
  }

  revalidatePath("/zh-CN/assets");
}

// ==================== 统计 ====================

/**
 * 获取资产统计
 */
export async function getAssetStats(): Promise<AssetStats> {
  const session = await getSession();

  // 总数
  const total = await db.asset.count({
    where: {
      tenantId: session.user.tenantId,
      status: "active",
    },
  });

  // 按类别统计
  const byCategory = await db.asset.groupBy({
    by: ["fileCategory"],
    where: {
      tenantId: session.user.tenantId,
      status: "active",
    },
    _count: true,
  });

  // 总大小
  const sizeResult = await db.asset.aggregate({
    where: {
      tenantId: session.user.tenantId,
      status: "active",
    },
    _sum: {
      fileSize: true,
    },
  });

  const totalSize = sizeResult._sum.fileSize || BigInt(0);

  // 构建类别统计对象
  const categoryStats: Record<FileCategory, number> = {
    video: 0,
    image: 0,
    document: 0,
    audio: 0,
    other: 0,
  };

  for (const item of byCategory) {
    categoryStats[item.fileCategory as FileCategory] = item._count;
  }

  return {
    total,
    byCategory: categoryStats,
    totalSize,
    totalSizeFormatted: formatFileSize(totalSize),
  };
}

// ==================== 永久删除（管理员功能） ====================

/**
 * 永久删除资产（同时删除 OSS 文件）
 */
export async function permanentlyDeleteAssets(ids: string[]): Promise<void> {
  const session = await getSession();

  // 获取要删除的资产
  const assets = await db.asset.findMany({
    where: {
      id: { in: ids },
      tenantId: session.user.tenantId,
      status: "deleted",
    },
    select: { id: true, storageKey: true },
  });

  if (assets.length === 0) return;

  // 删除 OSS 文件
  const storageKeys = assets.map((a) => a.storageKey);
  await deleteObjects(storageKeys);

  // 删除数据库记录
  await db.asset.deleteMany({
    where: {
      id: { in: assets.map((a) => a.id) },
    },
  });

  revalidatePath("/zh-CN/assets");
}
