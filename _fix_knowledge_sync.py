path = r'D:\qoder\vertax\src\actions\knowledge.ts'
with open(path, 'rb') as f:
    data = f.read()

old = (
    b'  revalidatePath("/customer/knowledge/company");\r\n'
    b'\r\n'
    b'  return {\r\n'
    b'    id: profile.id,\r\n'
    b'    companyName: profile.companyName,'
)
if old not in data:
    print('NOT FOUND')
    raise SystemExit(1)

new = (
    b'  revalidatePath("/customer/knowledge/company");\r\n'
    b'  revalidatePath("/customer/radar");\r\n'
    b'\r\n'
    b'  // Sync targetIndustries -> RadarSearchProfile.industryCodes (non-blocking)\r\n'
    b'  if (data.targetIndustries !== undefined) {\r\n'
    b'    const industries = (data.targetIndustries as Array<{ name?: string } | string>)\r\n'
    b'      .map(i => (typeof i === \'string\' ? i : (i.name ?? \'\')))\r\n'
    b'      .filter(Boolean);\r\n'
    b'    if (industries.length) {\r\n'
    b'      (db as any).radarSearchProfile.updateMany({\r\n'
    b'        where: { tenantId: session.user.tenantId, industryCodes: { isEmpty: true } },\r\n'
    b'        data: { industryCodes: industries },\r\n'
    b'      }).catch(() => { /* non-critical */ });\r\n'
    b'    }\r\n'
    b'  }\r\n'
    b'\r\n'
    b'  return {\r\n'
    b'    id: profile.id,\r\n'
    b'    companyName: profile.companyName,'
)

data = data.replace(old, new, 1)
with open(path, 'wb') as f:
    f.write(data)
print('OK')
