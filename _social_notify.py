path = r'D:\qoder\vertax\src\actions\social.ts'
with open(path, 'rb') as f:
    d = f.read()

old = (
    b"  await db.socialPost.update({\r\n"
    b"    where: { id: postId },\r\n"
    b"    data: {\r\n"
    b"      status: allSuccess ? \"published\" : anySuccess ? \"published\" : \"failed\",\r\n"
    b"      publishedAt: anySuccess ? new Date() : undefined,\r\n"
    b"    },\r\n"
    b"  });\r\n"
    b"\r\n"
    b"  revalidatePath(\"/customer/social\");\r\n"
    b"\r\n"
    b"  return { success: allSuccess, results };\r\n"
    b"}"
)
new = (
    b"  const finalStatus = allSuccess ? \"published\" : anySuccess ? \"published\" : \"failed\";\r\n"
    b"  await db.socialPost.update({\r\n"
    b"    where: { id: postId },\r\n"
    b"    data: {\r\n"
    b"      status: finalStatus,\r\n"
    b"      publishedAt: anySuccess ? new Date() : undefined,\r\n"
    b"    },\r\n"
    b"  });\r\n"
    b"\r\n"
    b"  if (finalStatus === \"failed\") {\r\n"
    b"    const failedPlatforms = results.filter(r => !r.success).map(r => r.platform).join(\", \");\r\n"
    b"    try {\r\n"
    b"      await (db as unknown as Record<string, { create: (args: unknown) => Promise<unknown> }>).notification.create({\r\n"
    b"        data: {\r\n"
    b"          tenantId: session.user.tenantId,\r\n"
    b"          type: \"publish_failed\",\r\n"
    b"          title: \"\xe7\xa4\xbe\xe5\xaa\x92\xe5\xb8\x96\xe5\xad\x90\xe5\x8f\x91\xe5\xb8\x83\xe5\xa4\xb1\xe8\xb4\xa5\",\r\n"
    b"          body: `\xe3\x80\x8c${post.title || \"\xe6\x97\xa0\xe6\xa0\x87\xe9\xa2\x98\"}\xe3\x80\x8d\xe5\x9c\xa8 ${failedPlatforms} \xe5\x8f\x91\xe5\xb8\x83\xe5\xa4\xb1\xe8\xb4\xa5\xef\xbc\x8c\xe8\xaf\xb7\xe6\xa3\x80\xe6\x9f\xa5\xe8\xb4\xa6\xe5\x8f\xb7\xe6\x8e\x88\xe6\x9d\x83\xe3\x80\x82`,\r\n"
    b"          actionUrl: \"/customer/social\",\r\n"
    b"        },\r\n"
    b"      });\r\n"
    b"    } catch {\r\n"
    b"      // no-op if Notification model not yet migrated\r\n"
    b"    }\r\n"
    b"  }\r\n"
    b"\r\n"
    b"  revalidatePath(\"/customer/social\");\r\n"
    b"\r\n"
    b"  return { success: allSuccess, results };\r\n"
    b"}"
)
assert old in d, 'pattern not found'
d = d.replace(old, new, 1)

with open(path, 'wb') as f:
    f.write(d)
print('OK')
