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

export async function getSeoContents() {
  const session = await getSession();
  return db.seoContent.findMany({
    where: { tenantId: session.user.tenantId, deletedAt: null },
    include: { category: true, author: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getSeoContent(id: string) {
  const session = await getSession();
  return db.seoContent.findFirst({
    where: { id, tenantId: session.user.tenantId, deletedAt: null },
    include: { category: true, author: true },
  });
}

export async function createSeoContent(data: {
  title: string;
  categoryId: string;
  excerpt?: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  status?: string;
}) {
  const session = await getSession();
  const slug =
    data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `content-${Date.now()}`;

  const content = await db.seoContent.create({
    data: {
      tenantId: session.user.tenantId,
      authorId: session.user.id,
      title: data.title,
      slug,
      categoryId: data.categoryId,
      excerpt: data.excerpt,
      content: data.content,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      keywords: data.keywords || [],
      status: data.status || "draft",
    },
  });

  revalidatePath("/zh-CN/seo");
  return content;
}

export async function getContentCategories() {
  const session = await getSession();
  return db.contentCategory.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { order: "asc" },
  });
}

export async function createContentCategory(data: {
  name: string;
  slug: string;
  description?: string;
}) {
  const session = await getSession();
  const category = await db.contentCategory.create({
    data: {
      tenantId: session.user.tenantId,
      name: data.name,
      slug: data.slug,
      description: data.description,
    },
  });
  revalidatePath("/zh-CN/seo/categories");
  return category;
}

export async function deleteContentCategory(id: string) {
  await getSession();
  await db.contentCategory.delete({ where: { id } });
  revalidatePath("/zh-CN/seo/categories");
}
