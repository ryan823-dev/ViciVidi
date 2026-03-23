import * as cheerio from "cheerio";
import { db } from "@/lib/db";
import { AUDIT_WEIGHTS } from "@/lib/constants";
import { runAllChecks, type AuditFinding } from "./audit-checks";

// ==================== SSRF PROTECTION ====================

const BLOCKED_HOSTS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
  "169.254.169.254", // AWS metadata
];

function isUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    if (BLOCKED_HOSTS.includes(parsed.hostname)) return false;
    // Block private IP ranges
    const parts = parsed.hostname.split(".");
    if (parts.length === 4) {
      const [a, b] = parts.map(Number);
      if (a === 10) return false;
      if (a === 172 && b >= 16 && b <= 31) return false;
      if (a === 192 && b === 168) return false;
    }
    return true;
  } catch (error) {
    console.warn('[isPublicIP] IP parsing error:', error);
    return false;
  }
}

// ==================== FETCH UTILITIES ====================

async function fetchWithTimeout(
  url: string,
  timeoutMs: number = 15000
): Promise<{ text: string; ok: boolean; status: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SEOAuditBot/1.0; +https://mroport.com)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
    const text = await res.text();
    return { text, ok: res.ok, status: res.status };
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      return { text: "", ok: false, status: 0 };
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// ==================== PROGRESS UPDATER ====================

async function updateProgress(
  auditId: string,
  data: {
    status?: string;
    progress?: number;
    currentStep?: string;
  }
) {
  await db.seoAudit.update({
    where: { id: auditId },
    data,
  });
}

// ==================== CRAWL FUNCTIONS ====================

interface CrawlResult {
  homepageHtml: string;
  robotsTxt: string;
  sitemapContent: string;
  innerPages: { url: string; html: string }[];
  errors: { step: string; error: string }[];
  pagesCrawled: number;
}

async function crawlTarget(
  auditId: string,
  targetUrl: string
): Promise<CrawlResult> {
  const result: CrawlResult = {
    homepageHtml: "",
    robotsTxt: "",
    sitemapContent: "",
    innerPages: [],
    errors: [],
    pagesCrawled: 0,
  };

  const baseUrl = new URL(targetUrl);
  const origin = baseUrl.origin;

  // Step 1: Homepage
  await updateProgress(auditId, {
    progress: 10,
    currentStep: "Fetching homepage...",
  });
  try {
    const homepage = await fetchWithTimeout(targetUrl, 20000);
    if (homepage.ok) {
      result.homepageHtml = homepage.text;
      result.pagesCrawled++;
    } else {
      result.errors.push({
        step: "homepage",
        error: `HTTP ${homepage.status}`,
      });
    }
  } catch (e) {
    result.errors.push({
      step: "homepage",
      error: (e as Error).message,
    });
  }

  // Step 2: robots.txt
  await updateProgress(auditId, {
    progress: 25,
    currentStep: "Fetching robots.txt...",
  });
  try {
    const robots = await fetchWithTimeout(`${origin}/robots.txt`, 10000);
    if (robots.ok) {
      result.robotsTxt = robots.text;
    }
  } catch (e) {
    result.errors.push({
      step: "robots.txt",
      error: (e as Error).message,
    });
  }

  // Step 3: sitemap.xml
  await updateProgress(auditId, {
    progress: 35,
    currentStep: "Fetching sitemap...",
  });
  try {
    // Try common sitemap locations
    let sitemapUrl = `${origin}/sitemap_index.xml`;
    let sitemap = await fetchWithTimeout(sitemapUrl, 10000);
    if (!sitemap.ok || !sitemap.text.includes("<")) {
      sitemapUrl = `${origin}/sitemap.xml`;
      sitemap = await fetchWithTimeout(sitemapUrl, 10000);
    }
    if (sitemap.ok && sitemap.text.includes("<")) {
      result.sitemapContent = sitemap.text;
    }
  } catch (e) {
    result.errors.push({
      step: "sitemap",
      error: (e as Error).message,
    });
  }

  // Step 4: Sample inner pages from sitemap
  await updateProgress(auditId, {
    progress: 45,
    currentStep: "Sampling inner pages...",
  });
  if (result.sitemapContent) {
    try {
      const urlMatches = result.sitemapContent.match(
        /<loc>([^<]+)<\/loc>/g
      );
      if (urlMatches && urlMatches.length > 0) {
        const urls = urlMatches
          .map((m) => m.replace(/<\/?loc>/g, "").trim())
          .filter(
            (u) =>
              u !== targetUrl &&
              u !== `${targetUrl}/` &&
              u.startsWith(origin)
          );

        // Sample up to 3 inner pages (spread evenly)
        const sampleCount = Math.min(3, urls.length);
        const step = Math.max(1, Math.floor(urls.length / sampleCount));
        const sampled = [];
        for (let i = 0; i < sampleCount; i++) {
          sampled.push(urls[i * step]);
        }

        for (let i = 0; i < sampled.length; i++) {
          await updateProgress(auditId, {
            progress: 45 + Math.round(((i + 1) / sampled.length) * 10),
            currentStep: `Fetching inner page ${i + 1}/${sampled.length}...`,
          });
          try {
            const page = await fetchWithTimeout(sampled[i], 10000);
            if (page.ok) {
              result.innerPages.push({
                url: sampled[i],
                html: page.text,
              });
              result.pagesCrawled++;
            }
          } catch {
            // skip failed inner pages silently
          }
          // Rate limit: 500ms between requests
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    } catch {
      // sitemap parsing failed, continue without inner pages
    }
  }

  return result;
}

// ==================== SCORING ====================

function calculateScores(findings: AuditFinding[]): Record<string, number> {
  const categoryScores: Record<string, { total: number; count: number }> = {};

  for (const f of findings) {
    if (!categoryScores[f.category]) {
      categoryScores[f.category] = { total: 0, count: 0 };
    }
    categoryScores[f.category].total += f.score;
    categoryScores[f.category].count++;
  }

  const scores: Record<string, number> = {};
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [cat, data] of Object.entries(categoryScores)) {
    scores[cat] = Math.round(data.total / data.count);
    const weight = AUDIT_WEIGHTS[cat] ?? 0;
    weightedSum += scores[cat] * weight;
    totalWeight += weight;
  }

  scores.overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  return scores;
}

// ==================== MAIN PIPELINE ====================

export async function runAudit(auditId: string): Promise<void> {
  const startTime = Date.now();

  try {
    const audit = await db.seoAudit.findUnique({ where: { id: auditId } });
    if (!audit || audit.status !== "pending") return;

    // Validate URL
    if (!isUrlSafe(audit.targetUrl)) {
      await db.seoAudit.update({
        where: { id: auditId },
        data: {
          status: "failed",
          currentStep: "Invalid or blocked URL.",
          crawlErrors: [{ step: "validation", error: "URL is not allowed (private IP or invalid protocol)" }],
        },
      });
      return;
    }

    // Phase 1: Crawling
    await updateProgress(auditId, {
      status: "crawling",
      progress: 5,
      currentStep: "Starting crawl...",
    });

    const crawlResult = await crawlTarget(auditId, audit.targetUrl);

    if (!crawlResult.homepageHtml) {
      await db.seoAudit.update({
        where: { id: auditId },
        data: {
          status: "failed",
          progress: 0,
          currentStep: "Failed to fetch homepage.",
          crawlErrors: crawlResult.errors,
          crawlDuration: Date.now() - startTime,
        },
      });
      return;
    }

    // Phase 2: Analyzing
    await updateProgress(auditId, {
      status: "analyzing",
      progress: 60,
      currentStep: "Analyzing homepage...",
    });

    const $ = cheerio.load(crawlResult.homepageHtml);
    const findings = runAllChecks({
      $,
      url: audit.targetUrl,
      robotsTxt: crawlResult.robotsTxt,
      sitemapContent: crawlResult.sitemapContent,
    });

    // Analyze inner pages (aggregate extra insights)
    await updateProgress(auditId, {
      progress: 75,
      currentStep: "Analyzing inner pages...",
    });

    const innerPageIssues: string[] = [];
    for (const page of crawlResult.innerPages) {
      const inner$ = cheerio.load(page.html);
      const innerTitle = inner$("title").text().trim();
      const innerDesc = inner$('meta[name="description"]').attr("content")?.trim();
      const innerH1Count = inner$("h1").length;

      if (!innerTitle) innerPageIssues.push(`${page.url}: missing title`);
      if (!innerDesc) innerPageIssues.push(`${page.url}: missing meta description`);
      if (innerH1Count === 0) innerPageIssues.push(`${page.url}: missing H1`);
      if (innerH1Count > 1) innerPageIssues.push(`${page.url}: ${innerH1Count} H1 tags`);
    }

    if (innerPageIssues.length > 0 && crawlResult.innerPages.length > 0) {
      findings.push({
        category: "onPage",
        factor: "Inner Page Consistency",
        status: innerPageIssues.length > 3 ? "fail" : "warn",
        score: Math.max(0, 100 - innerPageIssues.length * 15),
        message: `Found ${innerPageIssues.length} issue(s) across ${crawlResult.innerPages.length} sampled inner page(s).`,
        recommendation: `Inner page issues found:\n${innerPageIssues.slice(0, 5).join("\n")}${innerPageIssues.length > 5 ? `\n... and ${innerPageIssues.length - 5} more` : ""}`,
      });
    }

    // Phase 3: Scoring
    await updateProgress(auditId, {
      progress: 85,
      currentStep: "Calculating scores...",
    });

    const scores = calculateScores(findings);

    // Phase 4: AI Summary (optional, non-blocking)
    let aiSummary: string | null = null;
    try {
      await updateProgress(auditId, {
        progress: 90,
        currentStep: "Generating AI summary...",
      });
      const { generateAuditSummary } = await import("./openai.service");
      aiSummary = await generateAuditSummary({
        url: audit.targetUrl,
        scores,
        findings: findings.map((f) => ({
          factor: f.factor,
          status: f.status,
          message: f.message,
        })),
        language: "en",
      });
    } catch (error) {
      console.warn('[runSeoAudit] AI summary failed:', error);
    }

    // Phase 5: Save results
    await db.seoAudit.update({
      where: { id: auditId },
      data: {
        status: "completed",
        progress: 100,
        currentStep: "Audit complete.",
        scores,
        findings: JSON.parse(JSON.stringify(findings)),
        aiSummary,
        crawlErrors: crawlResult.errors,
        pagesCrawled: crawlResult.pagesCrawled,
        crawlDuration: Date.now() - startTime,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    await db.seoAudit.update({
      where: { id: auditId },
      data: {
        status: "failed",
        currentStep: `Unexpected error: ${(error as Error).message}`,
        crawlErrors: [
          { step: "pipeline", error: (error as Error).message },
        ],
        crawlDuration: Date.now() - startTime,
      },
    });
  }
}
