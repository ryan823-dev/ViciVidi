path = r'D:\qoder\vertax\src\actions\publishing.ts'
with open(path, 'rb') as f:
    d = f.read()

# 1. Update import to use PublisherAdapterConfig
old1 = b'import { createPublisherAdapter, mapVertaxToPaintcell } from "@/lib/publishers";\r\nimport type { PaintcellResourceCategory } from "@/lib/publishers";'
new1 = b'import { createPublisherAdapter, mapVertaxToPaintcell } from "@/lib/publishers";\r\nimport type { PublisherAdapterConfig } from "@/lib/publishers";'
assert old1 in d, 'import not found'
d = d.replace(old1, new1, 1)
print('1 import OK')

# 2. getWebsiteConfig - add new fields to select
old2 = (
    b"  return {\r\n"
    b"    id: config.id,\r\n"
    b"    url: config.url,\r\n"
    b"    siteType: config.siteType,\r\n"
    b"    isActive: config.isActive,\r\n"
    b"    supabaseUrl: config.supabaseUrl,\r\n"
    b"    functionName: config.functionName,\r\n"
    b"  };\r\n"
    b"}"
)
new2 = (
    b"  return {\r\n"
    b"    id: config.id,\r\n"
    b"    siteName: config.siteName,\r\n"
    b"    url: config.url,\r\n"
    b"    siteType: config.siteType,\r\n"
    b"    isActive: config.isActive,\r\n"
    b"    supabaseUrl: config.supabaseUrl,\r\n"
    b"    functionName: config.functionName,\r\n"
    b"    webhookUrl: config.webhookUrl,\r\n"
    b"    wpUrl: config.wpUrl,\r\n"
    b"    wpUsername: config.wpUsername,\r\n"
    b"    pushSecret: config.pushSecret,\r\n"
    b"  };\r\n"
    b"}"
)
assert old2 in d, 'getWebsiteConfig return not found'
d = d.replace(old2, new2, 1)
print('2 getWebsiteConfig OK')

# 3. Replace findUnique (unique tenantId) with findFirst (1:N, pick first active)
old3 = (
    b"  // 2. \xe6\x9f\xa5\xe6\x89\xbe\xe7\xbd\x91\xe7\xab\x99\xe9\x85\x8d\xe7\xbd\xae\r\n"
    b"  const websiteConfig = await prisma.websiteConfig.findUnique({\r\n"
    b"    where: { tenantId: tenantId },\r\n"
    b"  });"
)
new3 = (
    b"  // 2. \xe6\x9f\xa5\xe6\x89\xbe\xe7\xbd\x91\xe7\xab\x99\xe9\x85\x8d\xe7\xbd\xae\xef\xbc\x88\xe5\x8f\x96\xe7\xac\xac\xe4\xb8\x80\xe4\xb8\xaa\xe6\x97\xa0\xe5\x8f\x82\xe6\x95\xb0\xe8\xb0\x83\xe7\x94\xa8\xe6\x97\xb6\xef\xbc\x89\r\n"
    b"  const websiteConfig = await prisma.websiteConfig.findFirst({\r\n"
    b"    where: { tenantId: tenantId, isActive: true },\r\n"
    b"    orderBy: { createdAt: 'asc' },\r\n"
    b"  });"
)
assert old3 in d, 'findUnique not found'
d = d.replace(old3, new3, 1)
print('3 findFirst OK')

# 4. Replace createPublisherAdapter call with new PublisherAdapterConfig shape
old4 = (
    b"    adapter = createPublisherAdapter({\r\n"
    b"      siteType: websiteConfig.siteType,\r\n"
    b"      supabaseUrl: websiteConfig.supabaseUrl,\r\n"
    b"      functionName: websiteConfig.functionName,\r\n"
    b"      pushSecret: websiteConfig.pushSecret,\r\n"
    b"    });"
)
new4 = (
    b"    adapter = createPublisherAdapter({\r\n"
    b"      siteType: websiteConfig.siteType,\r\n"
    b"      supabaseUrl: websiteConfig.supabaseUrl,\r\n"
    b"      functionName: websiteConfig.functionName,\r\n"
    b"      webhookUrl: websiteConfig.webhookUrl,\r\n"
    b"      wpUrl: websiteConfig.wpUrl,\r\n"
    b"      wpUsername: websiteConfig.wpUsername,\r\n"
    b"      wpPassword: websiteConfig.wpPassword,\r\n"
    b"      pushSecret: websiteConfig.pushSecret,\r\n"
    b"      customHeaders: (websiteConfig.customHeaders as Record<string, string> | null) ?? null,\r\n"
    b"    } as PublisherAdapterConfig);"
)
assert old4 in d, 'createPublisherAdapter call not found'
d = d.replace(old4, new4, 1)
print('4 adapter config OK')

# 5. Add contentVersion + contentSnapshot to PushRecord create/update
old5 = (
    b"      pushPayload: JSON.parse(JSON.stringify(payload)),\r\n"
    b"      pushedAt: now,\r\n"
    b"      timeoutAt,\r\n"
    b"      retryCount: 0,\r\n"
    b"      lastError: result.error || null,\r\n"
    b"    },\r\n"
    b"    update: {\r\n"
    b"      status: result.success ? \"PENDING\" : \"FAILED\",\r\n"
    b"      remoteId: result.remoteId || null,\r\n"
    b"      remoteSlug: result.remoteSlug || null,\r\n"
    b"      targetUrl: result.remoteSlug\r\n"
    b"        ? `${websiteConfig.url || \"\"}/en/resources/articles/${result.remoteSlug}`\r\n"
    b"        : null,\r\n"
    b"      pushPayload: JSON.parse(JSON.stringify(payload)),\r\n"
    b"      pushedAt: now,\r\n"
    b"      timeoutAt,\r\n"
    b"      retryCount: { increment: 1 },\r\n"
    b"      lastError: result.error || null,\r\n"
    b"    },"
)
new5 = (
    b"      pushPayload: JSON.parse(JSON.stringify(payload)),\r\n"
    b"      contentVersion: content.version,\r\n"
    b"      contentSnapshot: { title: content.title, slug: content.slug, excerpt: content.excerpt, keywords: content.keywords },\r\n"
    b"      pushedAt: now,\r\n"
    b"      timeoutAt,\r\n"
    b"      retryCount: 0,\r\n"
    b"      lastError: result.error || null,\r\n"
    b"    },\r\n"
    b"    update: {\r\n"
    b"      status: result.success ? \"PENDING\" : \"FAILED\",\r\n"
    b"      remoteId: result.remoteId || null,\r\n"
    b"      remoteSlug: result.remoteSlug || null,\r\n"
    b"      targetUrl: result.remoteSlug\r\n"
    b"        ? `${websiteConfig.url || \"\"}/en/resources/articles/${result.remoteSlug}`\r\n"
    b"        : null,\r\n"
    b"      pushPayload: JSON.parse(JSON.stringify(payload)),\r\n"
    b"      contentVersion: content.version,\r\n"
    b"      contentSnapshot: { title: content.title, slug: content.slug, excerpt: content.excerpt, keywords: content.keywords },\r\n"
    b"      pushedAt: now,\r\n"
    b"      timeoutAt,\r\n"
    b"      retryCount: { increment: 1 },\r\n"
    b"      lastError: result.error || null,\r\n"
    b"    },"
)
assert old5 in d, 'pushRecord upsert not found'
d = d.replace(old5, new5, 1)
print('5 contentVersion/snapshot OK')

with open(path, 'wb') as f:
    f.write(d)
print('All done')
