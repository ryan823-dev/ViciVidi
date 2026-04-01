path = r'D:\qoder\vertax\src\actions\knowledge.ts'
with open(path, 'rb') as f:
    data = f.read()

# Remove EVERYTHING between the first revalidatePath and the return in analyzeAssets
# The analyzeAssets function ends with a `return {` that has id/companyName etc.
# We'll identify it by the unique suffix after the return

old_block = (
    b'  revalidatePath("/customer/knowledge/company");\r\n'
    b'  revalidatePath("/customer/radar");\r\n'
    b'\r\n'
    b'  revalidatePath("/customer/radar");\r\n'
    b'\r\n'
    b'  // Sync targetIndustries -> RadarSearchProfile.industryCodes (non-blocking)\r\n'
    b'  if (data.targetIndustries !== undefined) {\r\n'
    b'    const industries = (data.targetIndustries as Array<{ name?: string } | string>)\r\n'
    b"      .map(i => (typeof i === 'string' ? i : (i.name ?? '')))\r\n"
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
    b'    companyName: profile.companyName,\r\n'
    b'    companyIntro: profile.companyIntro,\r\n'
    b'    coreProducts: profile.coreProducts as CompanyProfileData["coreProducts"],'
)

if old_block not in data:
    print('NOT FOUND analyzeAssets messy block')
    raise SystemExit(1)

new_block = (
    b'  revalidatePath("/customer/knowledge/company");\r\n'
    b'\r\n'
    b'  return {\r\n'
    b'    id: profile.id,\r\n'
    b'    companyName: profile.companyName,\r\n'
    b'    companyIntro: profile.companyIntro,\r\n'
    b'    coreProducts: profile.coreProducts as CompanyProfileData["coreProducts"],'
)

data = data.replace(old_block, new_block, 1)
print('Cleaned analyzeAssets block OK')

# Now locate updateCompanyProfile revalidatePath (appears after analyzeAssets ends)
# Find the unique marker: revalidatePath followed by `\r\n\r\n  return {\r\n    id: profile.id`
# that appears in the second half of the file

idx = data.find(b'  revalidatePath("/customer/knowledge/company");\r\n\r\n  return {\r\n    id: profile.id')
if idx == -1:
    print('NOT FOUND updateCompanyProfile revalidatePath')
    raise SystemExit(1)
print(f'Found at {idx}')

SYNC_BLOCK = (
    b'  revalidatePath("/customer/radar");\r\n'
    b'\r\n'
    b'  // Sync targetIndustries -> RadarSearchProfile.industryCodes (non-blocking)\r\n'
    b'  if (data.targetIndustries !== undefined) {\r\n'
    b'    const industries = (data.targetIndustries as Array<{ name?: string } | string>)\r\n'
    b"      .map(i => (typeof i === 'string' ? i : (i.name ?? '')))\r\n"
    b'      .filter(Boolean);\r\n'
    b'    if (industries.length) {\r\n'
    b'      (db as any).radarSearchProfile.updateMany({\r\n'
    b'        where: { tenantId: session.user.tenantId, industryCodes: { isEmpty: true } },\r\n'
    b'        data: { industryCodes: industries },\r\n'
    b'      }).catch(() => { /* non-critical */ });\r\n'
    b'    }\r\n'
    b'  }\r\n'
)

insert = b'  revalidatePath("/customer/knowledge/company");\r\n' + SYNC_BLOCK + b'\r\n'
replace = b'  revalidatePath("/customer/knowledge/company");\r\n\r\n'
data = data[:idx] + insert + data[idx + len(replace):]
print('Added sync block to updateCompanyProfile OK')

with open(path, 'wb') as f:
    f.write(data)
print('Done')
