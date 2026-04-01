path = r'D:\qoder\vertax\src\actions\contents.ts'
with open(path, 'rb') as f:
    d = f.read()

old2 = (
    b"  if (input.content !== undefined || input.outline !== undefined) {\r\n"
    b"    await createVersion(\"SeoContent\", id, {\r\n"
    b"      title: updated.title,\r\n"
    b"      content: updated.content,\r\n"
    b"      outline: updated.outline,\r\n"
    b"      evidenceRefs: updated.evidenceRefs,\r\n"
    b"    }, { generatedBy: \"human\" });\r\n"
    b"  }\r\n"
    b"\r\n"
    b"  // Activity log"
)
new2 = (
    b"  if (input.content !== undefined || input.outline !== undefined) {\r\n"
    b"    await createVersion(\"SeoContent\", id, {\r\n"
    b"      title: updated.title,\r\n"
    b"      content: updated.content,\r\n"
    b"      outline: updated.outline,\r\n"
    b"      evidenceRefs: updated.evidenceRefs,\r\n"
    b"    }, { generatedBy: \"human\" });\r\n"
    b"  }\r\n"
    b"\r\n"
    b"  // Bump version on meaningful edits\r\n"
    b"  if (input.title !== undefined || input.content !== undefined || input.keywords !== undefined) {\r\n"
    b"    await prisma.seoContent.update({\r\n"
    b"      where: { id, tenantId: session.user.tenantId },\r\n"
    b"      data: { version: { increment: 1 } },\r\n"
    b"    }).catch(() => {});\r\n"
    b"  }\r\n"
    b"\r\n"
    b"  // Auto-push when content is published\r\n"
    b"  if (input.status === \"published\") {\r\n"
    b"    const { pushContentToWebsite } = await import(\"./publishing\");\r\n"
    b"    pushContentToWebsite(id).catch((err: unknown) =>\r\n"
    b"      console.warn(\"[auto-push] Failed for\", id, err)\r\n"
    b"    );\r\n"
    b"  }\r\n"
    b"\r\n"
    b"  // Activity log"
)
assert old2 in d, 'pattern not found'
d = d.replace(old2, new2, 1)
print('hook OK')

with open(path, 'wb') as f:
    f.write(d)
print('Done')
