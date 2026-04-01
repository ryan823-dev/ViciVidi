import { readFileSync, writeFileSync } from 'fs';

const path = 'src/actions/contents.ts';
let content = readFileSync(path, 'utf8');

// 1. Add import after existing imports
const importMarker = 'import type { Prisma } from "@prisma/client";';
if (!content.includes('seo-geo-pipeline')) {
  content = content.replace(
    importMarker,
    importMarker + '\r\nimport { runSeoGeoPipeline } from "@/lib/marketing/seo-geo-pipeline";'
  );
  console.log('Import added');
} else {
  console.log('Import already present');
}

// 2. Add type extension for ContentPieceData
const typeMarker = '  createdAt: Date;\r\n  updatedAt: Date;\r\n};\r\n\r\nexport type ContentOutline';
if (!content.includes('geoVersion?: string | null')) {
  content = content.replace(
    typeMarker,
    '  createdAt: Date;\r\n  updatedAt: Date;\r\n  // SEO-GEO pipeline fields\r\n  schemaJson?: object | null;\r\n  geoVersion?: string | null;\r\n  seoFramework?: string | null;\r\n  aiMetadata?: Record<string, unknown>;\r\n};\r\n\r\nexport type ContentOutline'
  );
  console.log('Type extended');
}

// 3. Add geoVersion + schemaJson to getContentPieceById return
const returnMarker = "    outline: c.outline as ContentOutline | null,\r\n    evidenceRefs: c.evidenceRefs,\r\n    categoryId: c.categoryId,\r\n    categoryName: c.category?.name || undefined,\r\n    authorName: c.author?.name || undefined,\r\n    createdAt: c.createdAt,\r\n    updatedAt: c.updatedAt,\r\n  };\r\n}\r\n\r\nexport async function createContentPiece";
if (!content.includes('geoVersion: (c.aiMetadata')) {
  content = content.replace(
    returnMarker,
    "    outline: c.outline as ContentOutline | null,\r\n    evidenceRefs: c.evidenceRefs,\r\n    schemaJson: c.schemaJson as object | null,\r\n    geoVersion: ((c.aiMetadata as Record<string, unknown>)?.geoVersion as string | null) || null,\r\n    seoFramework: ((c.aiMetadata as Record<string, unknown>)?.seoFramework as string | null) || null,\r\n    aiMetadata: c.aiMetadata as Record<string, unknown>,\r\n    categoryId: c.categoryId,\r\n    categoryName: c.category?.name || undefined,\r\n    authorName: c.author?.name || undefined,\r\n    createdAt: c.createdAt,\r\n    updatedAt: c.updatedAt,\r\n  };\r\n}\r\n\r\nexport async function createContentPiece"
  );
  console.log('getContentPieceById return extended');
}

// 4. Append the new generateFullContentPackage function at end
const newFunction = `
// ==================== AI: SEO-GEO Full Content Package (4-Block Pipeline) ====================

export type FullContentPackageResult = {
  contentId: string;
  title: string;
  slug: string;
  framework: string;
  wordCount: number;
  hasGeoVersion: boolean;
  hasSchemaJson: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string[];
};

/**
 * Generates a full SEO+GEO content package from a ContentBrief.
 * Runs the 4-step seo-geo-pipeline (keyword research → SERP → article → 4 blocks).
 * Creates or updates a SeoContent record with all output fields populated.
 */
export async function generateFullContentPackage(briefId: string): Promise<FullContentPackageResult> {
  const session = await getSession();

  // Load brief with persona context
  const brief = await prisma.contentBrief.findFirst({
    where: { id: briefId, tenantId: session.user.tenantId, deletedAt: null },
    include: {
      targetPersona: { select: { name: true, title: true, concerns: true } },
    },
  });
  if (!brief) throw new Error("Brief not found");

  // Load company profile for context injection
  const companyProfile = await prisma.companyProfile.findUnique({
    where: { tenantId: session.user.tenantId },
    select: { companyName: true, coreProducts: true, techAdvantages: true, targetMarkets: true },
  });

  // Load relevant evidence
  const evidenceIds = brief.evidenceIds || [];
  const evidence = evidenceIds.length > 0
    ? await prisma.evidence.findMany({
        where: { id: { in: evidenceIds }, tenantId: session.user.tenantId },
        select: { id: true, title: true, content: true },
        take: 8,
      })
    : [];

  // Build pipeline context
  const primaryKeyword = brief.targetKeywords[0] || brief.title;
  
  const products = Array.isArray(companyProfile?.coreProducts)
    ? (companyProfile.coreProducts as Array<{ name?: string }>).map(p => p?.name || '').filter(Boolean)
    : [];

  const advantages = Array.isArray(companyProfile?.techAdvantages)
    ? (companyProfile.techAdvantages as Array<{ title?: string }>).map(a => a?.title || '').filter(Boolean)
    : [];

  const pipelineCtx = {
    keyword: primaryKeyword,
    companyContext: companyProfile ? {
      name: companyProfile.companyName || session.user.tenantId,
      products,
      advantages,
      targetMarket: Array.isArray(companyProfile.targetMarkets)
        ? (companyProfile.targetMarkets as string[]).join(', ')
        : 'global B2B buyers',
    } : undefined,
    evidence: evidence.map(e => ({ id: e.id, title: e.title, content: e.content })),
    forceFramework: undefined,
  };

  // Run the 4-step pipeline
  const pkg = await runSeoGeoPipeline(pipelineCtx);

  // Find or create default category
  let categoryId = "";
  const defaultCategory = await prisma.contentCategory.findFirst({
    where: { tenantId: session.user.tenantId },
    select: { id: true },
  });
  if (defaultCategory) {
    categoryId = defaultCategory.id;
  } else {
    const newCat = await prisma.contentCategory.create({
      data: { tenantId: session.user.tenantId, name: "SEO Content", slug: "seo-content" },
    });
    categoryId = newCat.id;
  }

  // Build slug (ensure uniqueness by appending timestamp if needed)
  let slug = pkg.slug;
  const existing = await prisma.seoContent.findFirst({
    where: { tenantId: session.user.tenantId, slug, deletedAt: null },
  });
  if (existing) slug = \`\${slug}-\${Date.now()}\`;

  // Prepare aiMetadata (includes geoVersion + pipeline metadata)
  const aiMetadata = {
    geoVersion: pkg.geoVersion,
    seoFramework: pkg.framework,
    primaryKeyword: pkg.primaryKeyword,
    supportingKeywords: pkg.supportingKeywords,
    wordCount: pkg.wordCount,
    generatedAt: new Date().toISOString(),
    generatedBy: 'seo-geo-pipeline',
  };

  // Create or update SeoContent record
  const fullContent = pkg.article + (pkg.faqMarkdown ? \`\n\n\${pkg.faqMarkdown}\` : '');

  const seoContent = await prisma.seoContent.create({
    data: {
      tenantId: session.user.tenantId,
      authorId: session.user.id,
      categoryId,
      briefId,
      title: pkg.metaTitle || brief.title,
      slug,
      content: fullContent,
      excerpt: pkg.metaDescription,
      metaTitle: pkg.metaTitle,
      metaDescription: pkg.metaDescription,
      keywords: [pkg.primaryKeyword, ...pkg.supportingKeywords],
      outline: {
        sections: pkg.serpAnalysis.mustCover.map(angle => ({
          heading: angle,
          keyPoints: [],
        })),
      } as Prisma.InputJsonValue,
      evidenceRefs: evidenceIds,
      schemaJson: pkg.schemaJsonLd as Prisma.InputJsonValue,
      aiMetadata: aiMetadata as Prisma.InputJsonValue,
      status: "draft",
    },
  });

  // Version snapshot
  await createVersion("SeoContent", seoContent.id, {
    title: seoContent.title,
    content: seoContent.content,
    outline: seoContent.outline,
    evidenceRefs: seoContent.evidenceRefs,
  }, { generatedBy: "seo-geo-pipeline", framework: pkg.framework });

  // Update brief status to in_progress
  await prisma.contentBrief.update({
    where: { id: briefId },
    data: { status: "in_progress" },
  });

  // Activity log
  logActivity({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "content.seo_geo_generated",
    entityType: "SeoContent",
    entityId: seoContent.id,
    eventCategory: EVENT_CATEGORIES.MARKETING,
    severity: "info",
    context: {
      briefId,
      keyword: primaryKeyword,
      framework: pkg.framework,
      wordCount: pkg.wordCount,
      hasGeoVersion: !!pkg.geoVersion,
    },
  });

  revalidatePath("/customer/marketing/contents");
  revalidatePath("/customer/marketing/briefs");
  revalidatePath("/customer/marketing/geo-center");

  return {
    contentId: seoContent.id,
    title: seoContent.title,
    slug: seoContent.slug,
    framework: pkg.framework,
    wordCount: pkg.wordCount,
    hasGeoVersion: !!pkg.geoVersion,
    hasSchemaJson: !!pkg.schemaJsonLd,
    metaTitle: pkg.metaTitle,
    metaDescription: pkg.metaDescription,
    keywords: seoContent.keywords as string[],
  };
}
`;

if (!content.includes('generateFullContentPackage')) {
  content = content + newFunction;
  console.log('generateFullContentPackage appended');
}

writeFileSync(path, content);
console.log('Done. File length:', content.length);
