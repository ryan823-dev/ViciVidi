path = r'D:\qoder\vertax\prisma\schema.prisma'
with open(path, 'rb') as f:
    d = f.read()

# 1. Add notifications relation to Tenant
old1 = b"  activities     Activity[]\r\n  assetFolders      AssetFolder[]"
new1 = b"  activities     Activity[]\r\n  notifications  Notification[]\r\n  assetFolders      AssetFolder[]"
assert old1 in d, 'tenant relation not found'
d = d.replace(old1, new1, 1)
print('1 OK')

# 2. Append Notification model at end of file
notification_model = b"""
// ==================== NOTIFICATIONS ====================

model Notification {
  id        String    @id @default(cuid())
  tenantId  String
  tenant    Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  type      String    // "tier_a_lead" | "geo_citation" | "publish_failed" | "system"
  title     String
  body      String
  actionUrl String?
  readAt    DateTime?

  createdAt DateTime  @default(now())

  @@index([tenantId])
  @@index([tenantId, readAt])
  @@map("notifications")
}
"""
assert d.endswith(b'\r\n') or d.endswith(b'\n'), 'unexpected file end'
d = d.rstrip(b'\r\n') + b'\r\n' + notification_model
print('2 OK')

with open(path, 'wb') as f:
    f.write(d)
print('Done')
