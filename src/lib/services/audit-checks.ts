import type { CheerioAPI } from "cheerio";

export type FindingStatus = "pass" | "warn" | "fail";

export interface AuditFinding {
  category: string;
  factor: string;
  status: FindingStatus;
  score: number; // 0-100
  message: string;
  recommendation: string;
}

// ==================== TECHNICAL SEO ====================

export function checkTitleTag($: CheerioAPI): AuditFinding {
  const title = $("title").first().text().trim();
  if (!title) {
    return {
      category: "technical",
      factor: "Title Tag",
      status: "fail",
      score: 0,
      message: "No <title> tag found on the page.",
      recommendation:
        "Add a descriptive <title> tag between 30-60 characters that includes your primary keyword.",
    };
  }
  const len = title.length;
  if (len < 30) {
    return {
      category: "technical",
      factor: "Title Tag",
      status: "warn",
      score: 60,
      message: `Title tag is too short (${len} chars): "${title}"`,
      recommendation:
        "Expand the title to 30-60 characters. Include your primary keyword and brand name.",
    };
  }
  if (len > 60) {
    return {
      category: "technical",
      factor: "Title Tag",
      status: "warn",
      score: 70,
      message: `Title tag is too long (${len} chars) and may be truncated in search results.`,
      recommendation:
        "Shorten the title to 60 characters or fewer so it displays fully in SERPs.",
    };
  }
  return {
    category: "technical",
    factor: "Title Tag",
    status: "pass",
    score: 100,
    message: `Good title tag (${len} chars): "${title}"`,
    recommendation: "",
  };
}

export function checkMetaDescription($: CheerioAPI): AuditFinding {
  const desc =
    $('meta[name="description"]').attr("content")?.trim() ?? "";
  if (!desc) {
    return {
      category: "technical",
      factor: "Meta Description",
      status: "fail",
      score: 0,
      message: "No meta description found.",
      recommendation:
        "Add a <meta name=\"description\"> tag with 120-160 characters summarizing the page content.",
    };
  }
  const len = desc.length;
  if (len < 120) {
    return {
      category: "technical",
      factor: "Meta Description",
      status: "warn",
      score: 60,
      message: `Meta description is short (${len} chars).`,
      recommendation:
        "Expand the meta description to 120-160 characters to maximize SERP visibility.",
    };
  }
  if (len > 160) {
    return {
      category: "technical",
      factor: "Meta Description",
      status: "warn",
      score: 70,
      message: `Meta description is long (${len} chars) and may be truncated.`,
      recommendation:
        "Shorten the meta description to 160 characters or fewer.",
    };
  }
  return {
    category: "technical",
    factor: "Meta Description",
    status: "pass",
    score: 100,
    message: `Good meta description (${len} chars).`,
    recommendation: "",
  };
}

export function checkCanonical(
  $: CheerioAPI,
  pageUrl: string
): AuditFinding {
  const canonical = $('link[rel="canonical"]').attr("href")?.trim() ?? "";
  if (!canonical) {
    return {
      category: "technical",
      factor: "Canonical URL",
      status: "fail",
      score: 0,
      message: "No canonical URL found.",
      recommendation:
        'Add <link rel="canonical" href="..."> pointing to the preferred version of this page.',
    };
  }
  // Normalize for comparison
  const norm = (u: string) => u.replace(/\/+$/, "").toLowerCase();
  if (norm(canonical) !== norm(pageUrl)) {
    return {
      category: "technical",
      factor: "Canonical URL",
      status: "warn",
      score: 60,
      message: `Canonical URL (${canonical}) differs from the page URL (${pageUrl}).`,
      recommendation:
        "Ensure the canonical URL matches the page URL unless intentionally consolidating duplicate pages.",
    };
  }
  return {
    category: "technical",
    factor: "Canonical URL",
    status: "pass",
    score: 100,
    message: "Canonical URL is set correctly.",
    recommendation: "",
  };
}

export function checkHttps(url: string): AuditFinding {
  const isHttps = url.startsWith("https://");
  if (!isHttps) {
    return {
      category: "technical",
      factor: "HTTPS",
      status: "fail",
      score: 0,
      message: "The site does not use HTTPS.",
      recommendation:
        "Migrate to HTTPS. It is a confirmed Google ranking factor and required for user trust.",
    };
  }
  return {
    category: "technical",
    factor: "HTTPS",
    status: "pass",
    score: 100,
    message: "Site uses HTTPS.",
    recommendation: "",
  };
}

export function checkRobotsMeta($: CheerioAPI): AuditFinding {
  const robotsMeta =
    $('meta[name="robots"]').attr("content")?.toLowerCase() ?? "";
  if (robotsMeta.includes("noindex")) {
    return {
      category: "technical",
      factor: "Robots Meta",
      status: "fail",
      score: 0,
      message:
        'Page has a "noindex" robots meta tag — search engines will NOT index this page.',
      recommendation:
        "Remove the noindex directive unless you intentionally want this page excluded from search results.",
    };
  }
  return {
    category: "technical",
    factor: "Robots Meta",
    status: "pass",
    score: 100,
    message: "No noindex directive found. Page is indexable.",
    recommendation: "",
  };
}

// ==================== ON-PAGE SEO ====================

export function checkH1Tag($: CheerioAPI): AuditFinding {
  const h1s = $("h1");
  const count = h1s.length;
  if (count === 0) {
    return {
      category: "onPage",
      factor: "H1 Tag",
      status: "fail",
      score: 0,
      message: "No H1 tag found on the page.",
      recommendation:
        "Add exactly one H1 tag that clearly describes the page topic and includes the primary keyword.",
    };
  }
  if (count > 1) {
    return {
      category: "onPage",
      factor: "H1 Tag",
      status: "warn",
      score: 50,
      message: `Found ${count} H1 tags. Only one is recommended.`,
      recommendation:
        "Reduce to a single H1 tag. Use H2-H6 for sub-headings.",
    };
  }
  const text = h1s.first().text().trim();
  if (!text || text.length < 5) {
    return {
      category: "onPage",
      factor: "H1 Tag",
      status: "warn",
      score: 40,
      message: `H1 tag is empty or too short: "${text}"`,
      recommendation:
        "Write a descriptive H1 tag (20-70 characters) that includes your primary keyword.",
    };
  }
  return {
    category: "onPage",
    factor: "H1 Tag",
    status: "pass",
    score: 100,
    message: `Good H1 tag: "${text.substring(0, 80)}${text.length > 80 ? "..." : ""}"`,
    recommendation: "",
  };
}

export function checkHeadingHierarchy($: CheerioAPI): AuditFinding {
  const headings: { level: number; text: string }[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const tag = (el as unknown as { tagName: string }).tagName?.toLowerCase() ?? "";
    const level = parseInt(tag.replace("h", ""), 10);
    if (!isNaN(level)) {
      headings.push({ level, text: $(el).text().trim().substring(0, 50) });
    }
  });

  if (headings.length === 0) {
    return {
      category: "onPage",
      factor: "Heading Hierarchy",
      status: "fail",
      score: 0,
      message: "No heading tags found on the page.",
      recommendation:
        "Add a logical heading structure: H1 for the main title, H2 for sections, H3 for sub-sections.",
    };
  }

  let skips = 0;
  for (let i = 1; i < headings.length; i++) {
    if (headings[i].level > headings[i - 1].level + 1) {
      skips++;
    }
  }

  if (skips > 0) {
    return {
      category: "onPage",
      factor: "Heading Hierarchy",
      status: "warn",
      score: Math.max(30, 100 - skips * 20),
      message: `Heading hierarchy has ${skips} level skip(s) (e.g. H1 → H3, skipping H2).`,
      recommendation:
        "Maintain a logical heading hierarchy without skipping levels (H1 → H2 → H3).",
    };
  }

  return {
    category: "onPage",
    factor: "Heading Hierarchy",
    status: "pass",
    score: 100,
    message: `Good heading hierarchy with ${headings.length} headings.`,
    recommendation: "",
  };
}

export function checkImageAltTexts($: CheerioAPI): AuditFinding {
  const images = $("img");
  const total = images.length;

  if (total === 0) {
    return {
      category: "onPage",
      factor: "Image Alt Texts",
      status: "pass",
      score: 100,
      message: "No images found on the page.",
      recommendation: "",
    };
  }

  let withAlt = 0;
  images.each((_, el) => {
    const alt = $(el).attr("alt")?.trim();
    if (alt && alt.length > 0) withAlt++;
  });

  const pct = Math.round((withAlt / total) * 100);

  if (pct < 50) {
    return {
      category: "onPage",
      factor: "Image Alt Texts",
      status: "fail",
      score: pct,
      message: `Only ${withAlt}/${total} images (${pct}%) have alt text.`,
      recommendation:
        "Add descriptive alt text to all images. This improves SEO, accessibility, and AI understanding.",
    };
  }
  if (pct < 90) {
    return {
      category: "onPage",
      factor: "Image Alt Texts",
      status: "warn",
      score: pct,
      message: `${withAlt}/${total} images (${pct}%) have alt text. Some are missing.`,
      recommendation:
        "Add descriptive alt text to all remaining images without alt attributes.",
    };
  }
  return {
    category: "onPage",
    factor: "Image Alt Texts",
    status: "pass",
    score: 100,
    message: `${withAlt}/${total} images (${pct}%) have alt text.`,
    recommendation: "",
  };
}

export function checkInternalLinks(
  $: CheerioAPI,
  pageUrl: string
): AuditFinding {
  let host: string;
  try {
    host = new URL(pageUrl).hostname;
  } catch {
    host = "";
  }

  let internalCount = 0;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    try {
      const linkHost = new URL(href, pageUrl).hostname;
      if (linkHost === host) internalCount++;
    } catch {
      // relative links count as internal
      if (href.startsWith("/") || href.startsWith("#")) internalCount++;
    }
  });

  if (internalCount === 0) {
    return {
      category: "onPage",
      factor: "Internal Links",
      status: "fail",
      score: 0,
      message: "No internal links found on the page.",
      recommendation:
        "Add internal links to relevant pages. This helps search engines crawl your site and distributes link equity.",
    };
  }
  if (internalCount < 3) {
    return {
      category: "onPage",
      factor: "Internal Links",
      status: "warn",
      score: 50,
      message: `Only ${internalCount} internal link(s) found.`,
      recommendation:
        "Add more internal links (aim for 5+) to improve site structure and crawlability.",
    };
  }
  return {
    category: "onPage",
    factor: "Internal Links",
    status: "pass",
    score: 100,
    message: `Found ${internalCount} internal links.`,
    recommendation: "",
  };
}

export function checkContentLength($: CheerioAPI): AuditFinding {
  // Remove scripts, styles, and nav elements to get body text
  const clone = $.root().clone();
  clone.find("script, style, nav, header, footer, noscript").remove();
  const text = clone.text().replace(/\s+/g, " ").trim();
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

  if (wordCount < 100) {
    return {
      category: "onPage",
      factor: "Content Length",
      status: "fail",
      score: 20,
      message: `Very thin content: ~${wordCount} words.`,
      recommendation:
        "Add more substantive content. Pages with fewer than 300 words rarely rank well. Aim for 800+ words for key pages.",
    };
  }
  if (wordCount < 300) {
    return {
      category: "onPage",
      factor: "Content Length",
      status: "warn",
      score: 50,
      message: `Content is thin: ~${wordCount} words.`,
      recommendation:
        "Expand the content to at least 300 words. For blog posts and guides, aim for 1,500+ words.",
    };
  }
  return {
    category: "onPage",
    factor: "Content Length",
    status: "pass",
    score: Math.min(100, 60 + Math.round(wordCount / 50)),
    message: `Good content length: ~${wordCount} words.`,
    recommendation: "",
  };
}

export function checkLanguageAttr($: CheerioAPI): AuditFinding {
  const lang = $("html").attr("lang")?.trim() ?? "";
  if (!lang) {
    return {
      category: "onPage",
      factor: "Language Attribute",
      status: "fail",
      score: 0,
      message: "No lang attribute on <html> tag.",
      recommendation:
        'Add a lang attribute to the <html> tag (e.g., <html lang="en">) to help search engines understand the page language.',
    };
  }
  return {
    category: "onPage",
    factor: "Language Attribute",
    status: "pass",
    score: 100,
    message: `Language attribute set: "${lang}"`,
    recommendation: "",
  };
}

// ==================== STRUCTURED DATA ====================

function extractJsonLd($: CheerioAPI): Record<string, unknown>[] {
  const schemas: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() ?? "");
      if (data["@graph"]) {
        schemas.push(...(data["@graph"] as Record<string, unknown>[]));
      } else {
        schemas.push(data as Record<string, unknown>);
      }
    } catch {
      // ignore parse errors
    }
  });
  return schemas;
}

export function checkSchemaPresence($: CheerioAPI): AuditFinding {
  const schemas = extractJsonLd($);
  if (schemas.length === 0) {
    return {
      category: "structuredData",
      factor: "Schema.org Presence",
      status: "fail",
      score: 0,
      message: "No JSON-LD structured data found.",
      recommendation:
        "Add Schema.org structured data (JSON-LD) to help search engines understand your content. Start with Organization and WebSite schemas.",
    };
  }
  const types = schemas.map((s) => s["@type"]).filter(Boolean);
  return {
    category: "structuredData",
    factor: "Schema.org Presence",
    status: "pass",
    score: 100,
    message: `Found ${schemas.length} schema object(s): ${types.join(", ")}`,
    recommendation: "",
  };
}

export function checkOrganizationSchema($: CheerioAPI): AuditFinding {
  const schemas = extractJsonLd($);
  const org = schemas.find((s) => s["@type"] === "Organization");
  if (!org) {
    return {
      category: "structuredData",
      factor: "Organization Schema",
      status: "fail",
      score: 0,
      message: "No Organization schema found.",
      recommendation:
        "Add Organization schema with: name, url, logo, description, contactPoint, sameAs (social profiles).",
    };
  }
  const requiredFields = ["name", "url", "logo"];
  const optionalFields = ["description", "contactPoint", "sameAs", "address"];
  const hasRequired = requiredFields.filter((f) => org[f]);
  const hasOptional = optionalFields.filter((f) => org[f]);
  const total = requiredFields.length + optionalFields.length;
  const found = hasRequired.length + hasOptional.length;
  const score = Math.round((found / total) * 100);

  if (hasRequired.length < requiredFields.length) {
    return {
      category: "structuredData",
      factor: "Organization Schema",
      status: "warn",
      score,
      message: `Organization schema is incomplete (${found}/${total} fields). Missing: ${requiredFields
        .filter((f) => !org[f])
        .join(", ")}`,
      recommendation:
        "Complete the Organization schema with all recommended fields: name, url, logo, description, contactPoint, sameAs, address.",
    };
  }
  if (hasOptional.length < optionalFields.length) {
    return {
      category: "structuredData",
      factor: "Organization Schema",
      status: "warn",
      score,
      message: `Organization schema found but missing optional fields: ${optionalFields
        .filter((f) => !org[f])
        .join(", ")}`,
      recommendation:
        "Add missing optional fields (description, contactPoint, sameAs, address) to strengthen your entity signals for AI engines.",
    };
  }
  return {
    category: "structuredData",
    factor: "Organization Schema",
    status: "pass",
    score: 100,
    message: "Organization schema is complete.",
    recommendation: "",
  };
}

export function checkProductSchema($: CheerioAPI): AuditFinding {
  const schemas = extractJsonLd($);
  const product = schemas.find((s) => s["@type"] === "Product");
  // Only flag if the page looks like a product page (heuristic)
  const hasAddToCart = $('[class*="add-to-cart"], [id*="add-to-cart"], button:contains("Add to Cart"), .woocommerce-product').length > 0;
  const hasPrice = $('[class*="price"], [itemprop="price"]').length > 0;

  if (!product && (hasAddToCart || hasPrice)) {
    return {
      category: "structuredData",
      factor: "Product Schema",
      status: "fail",
      score: 0,
      message:
        "This appears to be a product/e-commerce page but has no Product schema.",
      recommendation:
        "Add Product schema with: name, image, description, sku, brand, offers (price, availability). This enables rich snippets in Google.",
    };
  }
  if (!product) {
    return {
      category: "structuredData",
      factor: "Product Schema",
      status: "pass",
      score: 80,
      message: "No Product schema found (page does not appear to be a product page).",
      recommendation: "",
    };
  }
  return {
    category: "structuredData",
    factor: "Product Schema",
    status: "pass",
    score: 100,
    message: "Product schema is present.",
    recommendation: "",
  };
}

export function checkBreadcrumbSchema($: CheerioAPI): AuditFinding {
  const schemas = extractJsonLd($);
  const bc = schemas.find((s) => s["@type"] === "BreadcrumbList");
  if (!bc) {
    return {
      category: "structuredData",
      factor: "Breadcrumb Schema",
      status: "warn",
      score: 40,
      message: "No BreadcrumbList schema found.",
      recommendation:
        "Add BreadcrumbList schema to enable breadcrumb display in search results, improving click-through rates.",
    };
  }
  return {
    category: "structuredData",
    factor: "Breadcrumb Schema",
    status: "pass",
    score: 100,
    message: "BreadcrumbList schema is present.",
    recommendation: "",
  };
}

export function checkFAQSchema($: CheerioAPI): AuditFinding {
  const schemas = extractJsonLd($);
  const faq = schemas.find((s) => s["@type"] === "FAQPage");
  if (!faq) {
    return {
      category: "structuredData",
      factor: "FAQ Schema",
      status: "warn",
      score: 40,
      message: "No FAQPage schema found.",
      recommendation:
        "Add FAQ schema to content pages. This directly feeds AI answer engines and can earn rich snippets in Google.",
    };
  }
  return {
    category: "structuredData",
    factor: "FAQ Schema",
    status: "pass",
    score: 100,
    message: "FAQPage schema is present.",
    recommendation: "",
  };
}

// ==================== SOCIAL / SHARING ====================

export function checkOpenGraphTags($: CheerioAPI): AuditFinding {
  const ogFields = ["og:title", "og:description", "og:image", "og:url"];
  const found: string[] = [];
  const missing: string[] = [];

  for (const field of ogFields) {
    const content = $(`meta[property="${field}"]`).attr("content")?.trim();
    if (content) {
      found.push(field);
    } else {
      missing.push(field);
    }
  }

  if (found.length === 0) {
    return {
      category: "social",
      factor: "Open Graph Tags",
      status: "fail",
      score: 0,
      message: "No Open Graph meta tags found.",
      recommendation:
        "Add og:title, og:description, og:image, and og:url meta tags. These control how your page appears when shared on social media.",
    };
  }
  if (missing.length > 0) {
    return {
      category: "social",
      factor: "Open Graph Tags",
      status: "warn",
      score: Math.round((found.length / ogFields.length) * 100),
      message: `Missing OG tags: ${missing.join(", ")}`,
      recommendation: `Add the missing Open Graph tags: ${missing.join(", ")}`,
    };
  }
  return {
    category: "social",
    factor: "Open Graph Tags",
    status: "pass",
    score: 100,
    message: "All essential Open Graph tags are present.",
    recommendation: "",
  };
}

export function checkTwitterCards($: CheerioAPI): AuditFinding {
  const card = $('meta[name="twitter:card"]').attr("content")?.trim();
  if (!card) {
    return {
      category: "social",
      factor: "Twitter Cards",
      status: "warn",
      score: 30,
      message: "No twitter:card meta tag found.",
      recommendation:
        'Add <meta name="twitter:card" content="summary_large_image"> for rich previews when shared on X/Twitter.',
    };
  }
  return {
    category: "social",
    factor: "Twitter Cards",
    status: "pass",
    score: 100,
    message: `Twitter card type: "${card}"`,
    recommendation: "",
  };
}

export function checkSocialProfiles($: CheerioAPI): AuditFinding {
  const schemas = extractJsonLd($);
  const org = schemas.find((s) => s["@type"] === "Organization");
  const sameAs = org?.sameAs;
  if (!sameAs || (Array.isArray(sameAs) && sameAs.length === 0)) {
    return {
      category: "social",
      factor: "Social Profiles (sameAs)",
      status: "warn",
      score: 30,
      message:
        "No social profile links found in Organization schema (sameAs).",
      recommendation:
        "Add sameAs property to your Organization schema linking to your social media profiles (LinkedIn, Facebook, X, etc.).",
    };
  }
  const count = Array.isArray(sameAs) ? sameAs.length : 1;
  return {
    category: "social",
    factor: "Social Profiles (sameAs)",
    status: "pass",
    score: 100,
    message: `Found ${count} social profile link(s) in sameAs.`,
    recommendation: "",
  };
}

export function checkFavicon($: CheerioAPI): AuditFinding {
  const favicon =
    $('link[rel="icon"]').length > 0 ||
    $('link[rel="shortcut icon"]').length > 0 ||
    $('link[rel="apple-touch-icon"]').length > 0;
  if (!favicon) {
    return {
      category: "social",
      factor: "Favicon",
      status: "warn",
      score: 40,
      message: "No favicon link found.",
      recommendation:
        'Add a favicon (<link rel="icon" href="/favicon.ico">) for brand recognition in browser tabs and bookmarks.',
    };
  }
  return {
    category: "social",
    factor: "Favicon",
    status: "pass",
    score: 100,
    message: "Favicon is present.",
    recommendation: "",
  };
}

// ==================== GEO (AI ENGINE OPTIMIZATION) ====================

const AI_BOTS = ["GPTBot", "ClaudeBot", "Google-Extended", "Bytespider", "CCBot"];

export function checkAICrawlerAccess(robotsTxt: string): AuditFinding {
  if (!robotsTxt) {
    return {
      category: "geo",
      factor: "AI Crawler Access",
      status: "warn",
      score: 50,
      message: "No robots.txt found. AI crawlers can access by default, but explicit permission is better.",
      recommendation:
        "Create a robots.txt file and explicitly allow AI crawlers (GPTBot, ClaudeBot, Google-Extended).",
    };
  }

  const blocked: string[] = [];
  const lines = robotsTxt.split("\n").map((l) => l.trim());

  for (const bot of AI_BOTS) {
    let currentAgent = "";
    for (const line of lines) {
      const agentMatch = line.match(/^User-agent:\s*(.+)/i);
      if (agentMatch) {
        currentAgent = agentMatch[1].trim();
        continue;
      }
      if (
        currentAgent.toLowerCase() === bot.toLowerCase() &&
        /^Disallow:\s*\/$/i.test(line)
      ) {
        blocked.push(bot);
        break;
      }
    }
  }

  if (blocked.length === AI_BOTS.length) {
    return {
      category: "geo",
      factor: "AI Crawler Access",
      status: "fail",
      score: 0,
      message: `ALL major AI crawlers are blocked: ${blocked.join(", ")}. Your content will NEVER appear in AI-generated answers.`,
      recommendation:
        "Unblock AI crawlers in robots.txt (or Cloudflare AI bot settings). This is the #1 GEO issue — without crawler access, AI engines cannot cite your content.",
    };
  }
  if (blocked.length > 0) {
    return {
      category: "geo",
      factor: "AI Crawler Access",
      status: "warn",
      score: Math.round(((AI_BOTS.length - blocked.length) / AI_BOTS.length) * 100),
      message: `Some AI crawlers are blocked: ${blocked.join(", ")}`,
      recommendation: `Unblock the following AI crawlers in robots.txt: ${blocked.join(", ")}`,
    };
  }
  return {
    category: "geo",
    factor: "AI Crawler Access",
    status: "pass",
    score: 100,
    message: "All major AI crawlers are allowed.",
    recommendation: "",
  };
}

export function checkContentCitability($: CheerioAPI): AuditFinding {
  const lists = $("ul, ol").length;
  const tables = $("table").length;
  const blockquotes = $("blockquote").length;
  const definitionLists = $("dl").length;

  const structuredElements = lists + tables + blockquotes + definitionLists;

  if (structuredElements === 0) {
    return {
      category: "geo",
      factor: "Content Citability",
      status: "warn",
      score: 30,
      message:
        "No structured content elements (lists, tables, blockquotes) found. AI engines prefer structured, scannable content.",
      recommendation:
        "Add comparison tables, bullet-point lists, and quotable summary paragraphs. AI engines are more likely to cite well-structured content.",
    };
  }
  if (structuredElements < 3) {
    return {
      category: "geo",
      factor: "Content Citability",
      status: "warn",
      score: 60,
      message: `Limited structured content: ${lists} list(s), ${tables} table(s), ${blockquotes} quote(s).`,
      recommendation:
        "Add more structured elements (comparison tables, spec lists, FAQ sections) to increase the likelihood of AI citation.",
    };
  }
  return {
    category: "geo",
    factor: "Content Citability",
    status: "pass",
    score: 100,
    message: `Good structured content: ${lists} list(s), ${tables} table(s), ${blockquotes} quote(s).`,
    recommendation: "",
  };
}

export function checkAuthorEEAT($: CheerioAPI): AuditFinding {
  const schemas = extractJsonLd($);
  const article = schemas.find(
    (s) => s["@type"] === "Article" || s["@type"] === "BlogPosting"
  );

  // Check for author in schema
  const author = article?.author as Record<string, unknown> | undefined;
  const authorName =
    typeof author === "object" ? (author?.name as string) : undefined;

  // Also check HTML for author signals
  const byline =
    $('[class*="author"], [rel="author"], [itemprop="author"]').text().trim();

  const name = authorName || byline;

  if (!name) {
    // Not an article page — skip with neutral score
    if (!article) {
      return {
        category: "geo",
        factor: "Author E-E-A-T",
        status: "pass",
        score: 70,
        message:
          "No article schema detected — author attribution is not required for this page type.",
        recommendation: "",
      };
    }
    return {
      category: "geo",
      factor: "Author E-E-A-T",
      status: "fail",
      score: 0,
      message: "Article has no author attribution.",
      recommendation:
        'Add author name, bio, and credentials to blog/article content. Avoid using "admin" as the author name.',
    };
  }

  if (name.toLowerCase() === "admin" || name.toLowerCase() === "administrator") {
    return {
      category: "geo",
      factor: "Author E-E-A-T",
      status: "fail",
      score: 10,
      message: `Author is "${name}" — this destroys credibility signals (E-E-A-T).`,
      recommendation:
        "Replace with a real person's name or a professional team name (e.g., \"MROport Technical Team\"). Add author bio with credentials.",
    };
  }

  return {
    category: "geo",
    factor: "Author E-E-A-T",
    status: "pass",
    score: 100,
    message: `Author attributed: "${name}"`,
    recommendation: "",
  };
}

export function checkHowToSchema($: CheerioAPI): AuditFinding {
  const schemas = extractJsonLd($);
  const howto = schemas.find((s) => s["@type"] === "HowTo");
  if (!howto) {
    return {
      category: "geo",
      factor: "HowTo Schema",
      status: "warn",
      score: 40,
      message: "No HowTo schema found.",
      recommendation:
        "If this page contains instructional content, add HowTo schema. AI engines use it to provide step-by-step answers.",
    };
  }
  return {
    category: "geo",
    factor: "HowTo Schema",
    status: "pass",
    score: 100,
    message: "HowTo schema is present.",
    recommendation: "",
  };
}

export function checkSitemapPresence(sitemapContent: string): AuditFinding {
  if (!sitemapContent) {
    return {
      category: "geo",
      factor: "Sitemap",
      status: "fail",
      score: 0,
      message: "No sitemap.xml found.",
      recommendation:
        "Create a sitemap.xml and submit it to Google Search Console and Bing Webmaster Tools. This helps all search engines and AI crawlers discover your content.",
    };
  }
  if (
    !sitemapContent.includes("<urlset") &&
    !sitemapContent.includes("<sitemapindex")
  ) {
    return {
      category: "geo",
      factor: "Sitemap",
      status: "warn",
      score: 30,
      message: "Sitemap exists but does not appear to be valid XML.",
      recommendation:
        "Ensure sitemap.xml is valid XML conforming to the sitemap protocol.",
    };
  }
  return {
    category: "geo",
    factor: "Sitemap",
    status: "pass",
    score: 100,
    message: "Valid sitemap found.",
    recommendation: "",
  };
}

// ==================== RUNNER ====================

export function runAllChecks(params: {
  $: CheerioAPI;
  url: string;
  robotsTxt: string;
  sitemapContent: string;
}): AuditFinding[] {
  const { $, url, robotsTxt, sitemapContent } = params;

  return [
    // Technical SEO
    checkTitleTag($),
    checkMetaDescription($),
    checkCanonical($, url),
    checkHttps(url),
    checkRobotsMeta($),
    // On-Page SEO
    checkH1Tag($),
    checkHeadingHierarchy($),
    checkImageAltTexts($),
    checkInternalLinks($, url),
    checkContentLength($),
    checkLanguageAttr($),
    // Structured Data
    checkSchemaPresence($),
    checkOrganizationSchema($),
    checkProductSchema($),
    checkBreadcrumbSchema($),
    checkFAQSchema($),
    // Social
    checkOpenGraphTags($),
    checkTwitterCards($),
    checkSocialProfiles($),
    checkFavicon($),
    // GEO
    checkAICrawlerAccess(robotsTxt),
    checkContentCitability($),
    checkAuthorEEAT($),
    checkHowToSchema($),
    checkSitemapPresence(sitemapContent),
  ];
}
