path = r'D:\qoder\vertax\prisma\schema.prisma'
with open(path, 'rb') as f:
    d = f.read()

# 1. WebsiteConfig:
#    - tenantId @unique -> remove @unique (1:N)
#    - fix siteType comment
#    - add webhookUrl, wpUrl, wpUsername, wpPassword fields
#    - add siteName field
#    - add @@index([tenantId])

old1 = (
    b"  tenantId        String   @unique\r\n"
    b"  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)\r\n"
    b"  url             String?\r\n"
    b"  apiKey          String?\r\n"
    b"  publishEndpoint String?\r\n"
    b"  seoDefaults     Json     @default(\"{}\")\r\n"
    b"\r\n"
    b"  // === Publishing Pipeline \xe6\x89\xa9\xe5\xb1\x95 ===\r\n"
    b"  siteType        String   @default(\"supabase\") // supabase | wordpress | custom\r\n"
    b"  supabaseUrl     String?  // e.g. \"https://xxx.supabase.co\"\r\n"
    b"  functionName    String?  // e.g. \"receive-content-push\"\r\n"
    b"  pushSecret      String?  // \xe5\x8a\xa0\xe5\xaf\x86\xe5\xad\x98\xe5\x82\xa8\xe7\x9a\x84 shared secret\r\n"
    b"  fieldMapping    Json     @default(\"{}\") // Vertax \xe2\x86\x92 \xe7\x9b\xae\xe6\xa0\x87\xe7\xab\x99\xe5\xad\x97\xe6\xae\xb5\xe6\x98\xa0\xe5\xb0\x84\r\n"
    b"  approvalTimeoutHours Int @default(24)\r\n"
    b"  isActive        Boolean  @default(true)\r\n"
    b"\r\n"
    b"  pushRecords     PushRecord[]\r\n"
    b"\r\n"
    b"  createdAt       DateTime @default(now())\r\n"
    b"  updatedAt       DateTime @updatedAt\r\n"
    b"}"
)
new1 = (
    b"  tenantId        String\r\n"
    b"  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)\r\n"
    b"  siteName        String?  // \xe7\x9b\xae\xe6\xa0\x87\xe7\xab\x99\xe5\x90\x8d\xe7\xa7\xb0\xef\xbc\x88\xe5\xa4\x9a\xe7\xab\x99\xe5\x8c\xba\xe5\x88\x86\xef\xbc\x89\r\n"
    b"  url             String?\r\n"
    b"  apiKey          String?\r\n"
    b"  publishEndpoint String?\r\n"
    b"  seoDefaults     Json     @default(\"{}\")\r\n"
    b"\r\n"
    b"  // === Publishing Pipeline \xe6\x89\xa9\xe5\xb1\x95 ===\r\n"
    b"  siteType        String   @default(\"supabase\") // supabase | nextjs | wordpress | rest\r\n"
    b"  supabaseUrl     String?  // [supabase] e.g. \"https://xxx.supabase.co\"\r\n"
    b"  functionName    String?  // [supabase] e.g. \"receive-content-push\"\r\n"
    b"  webhookUrl      String?  // [nextjs | rest] \xe5\xae\xa2\xe6\x88\xb7\xe7\xab\x99\xe6\x8e\xa5\xe6\x94\xb6 endpoint\r\n"
    b"  wpUrl           String?  // [wordpress] WP \xe7\xab\x99\xe7\x82\xb9\xe6\xa0\xb9 URL\r\n"
    b"  wpUsername      String?  // [wordpress] WP \xe7\x94\xa8\xe6\x88\xb7\xe5\x90\x8d\r\n"
    b"  wpPassword      String?  // [wordpress] Application Password\r\n"
    b"  pushSecret      String?  // \xe5\x85\xb1\xe4\xba\xab\xe5\xaf\x86\xe9\x92\xa5\xef\xbc\x88HMAC\xe7\xad\xbe\xe5\x90\x8d / Bearer token\xef\xbc\x89\r\n"
    b"  customHeaders   Json?    // \xe8\x87\xaa\xe5\xae\x9a\xe4\xb9\x89\xe8\xaf\xb7\xe6\xb1\x82\xe5\xa4\xb4\xef\xbc\x88rest/nextjs \xe7\x94\xa8\xef\xbc\x89\r\n"
    b"  fieldMapping    Json     @default(\"{}\") // Vertax \xe2\x86\x92 \xe7\x9b\xae\xe6\xa0\x87\xe7\xab\x99\xe5\xad\x97\xe6\xae\xb5\xe6\x98\xa0\xe5\xb0\x84\r\n"
    b"  approvalTimeoutHours Int @default(24)\r\n"
    b"  isActive        Boolean  @default(true)\r\n"
    b"\r\n"
    b"  pushRecords     PushRecord[]\r\n"
    b"\r\n"
    b"  createdAt       DateTime @default(now())\r\n"
    b"  updatedAt       DateTime @updatedAt\r\n"
    b"\r\n"
    b"  @@index([tenantId])\r\n"
    b"}"
)
assert old1 in d, 'WebsiteConfig pattern not found'
d = d.replace(old1, new1, 1)
print('1 WebsiteConfig OK')

# 2. SeoContent: add version field after scheduledAt
old2 = (
    b"  scheduledAt     DateTime?\r\n"
    b"  aiMetadata      Json"
)
new2 = (
    b"  scheduledAt     DateTime?\r\n"
    b"  version         Int             @default(1)  // \xe5\x86\x85\xe5\xae\xb9\xe7\x89\x88\xe6\x9c\xac\xe5\x8f\xb7\xef\xbc\x8c\xe6\xaf\x8f\xe6\xac\xa1\xe4\xbf\x9d\xe5\xad\x98\xe8\x87\xaa\xe5\x8a\xa8 +1\r\n"
    b"  aiMetadata      Json"
)
assert old2 in d, 'SeoContent scheduledAt pattern not found'
d = d.replace(old2, new2, 1)
print('2 SeoContent.version OK')

# 3. PushRecord: add contentVersion + contentSnapshot after pushPayload
old3 = (
    b"  // \xe5\xad\x97\xe6\xae\xb5\xe5\xbf\xab\xe7\x85\xa7\xef\xbc\x88\xe6\x8e\xa8\xe9\x80\x81\xe6\x97\xb6\xe7\x9a\x84\xe6\x98\xa0\xe5\xb0\x84\xe7\xbb\x93\xe6\x9e\x9c\xef\xbc\x89\r\n"
    b"  pushPayload     Json?      // \xe5\xae\x9e\xe9\x99\x85\xe5\x8f\x91\xe9\x80\x81\xe7\x9a\x84 payload \xe5\xbf\xab\xe7\x85\xa7\r\n"
    b"\r\n"
    b"  // \xe6\x97\xb6\xe9\x97\xb4\xe8\xbf\xbd\xe8\xb8\xaa"
)
new3 = (
    b"  // \xe5\xad\x97\xe6\xae\xb5\xe5\xbf\xab\xe7\x85\xa7\xef\xbc\x88\xe6\x8e\xa8\xe9\x80\x81\xe6\x97\xb6\xe7\x9a\x84\xe6\x98\xa0\xe5\xb0\x84\xe7\xbb\x93\xe6\x9e\x9c\xef\xbc\x89\r\n"
    b"  pushPayload     Json?      // \xe5\xae\x9e\xe9\x99\x85\xe5\x8f\x91\xe9\x80\x81\xe7\x9a\x84 payload \xe5\xbf\xab\xe7\x85\xa7\r\n"
    b"  contentVersion  Int?       // \xe6\x8e\xa8\xe9\x80\x81\xe6\x97\xb6\xe5\xaf\xb9\xe5\xba\x94\xe7\x9a\x84 SeoContent.version\r\n"
    b"  contentSnapshot Json?      // { title, slug, excerpt, keywords } \xe5\xbf\xab\xe7\x85\xa7\r\n"
    b"\r\n"
    b"  // \xe6\x97\xb6\xe9\x97\xb4\xe8\xbf\xbd\xe8\xb8\xaa"
)
assert old3 in d, 'PushRecord pushPayload pattern not found'
d = d.replace(old3, new3, 1)
print('3 PushRecord.contentVersion OK')

with open(path, 'wb') as f:
    f.write(d)
print('All done')
