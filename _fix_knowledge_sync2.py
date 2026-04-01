path = r'D:\qoder\vertax\src\actions\knowledge.ts'
with open(path, 'rb') as f:
    data = f.read()

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

ANALYZE_REVALIDATE = b'  revalidatePath("/customer/knowledge/company");\r\n' + SYNC_BLOCK

if ANALYZE_REVALIDATE not in data:
    print('NOT FOUND: analyze block to remove')
    raise SystemExit(1)

# Remove from analyzeAssets
data = data.replace(ANALYZE_REVALIDATE, b'  revalidatePath("/customer/knowledge/company");\r\n', 1)
print('Removed from analyzeAssets OK')

# Now add to updateCompanyProfile - find the second revalidatePath call
# After removal, find revalidatePath("/customer/knowledge/company") in updateCompanyProfile
# The updateCompanyProfile function returns immediately after revalidatePath then has `return {`
# We need to find the one that is followed by `\r\n\r\n  return {\r\n    id: profile.id`

old2 = (
    b'  revalidatePath("/customer/knowledge/company");\r\n'
    b'\r\n'
    b'  return {\r\n'
    b'    id: profile.id,\r\n'
    b'    companyName: profile.companyName,\r\n'
    b'    companyIntro: profile.companyIntro,\r\n'
    b'    coreProducts: profile.coreProducts as CompanyProfileData["coreProducts"],\r\n'
    b'    techAdvantages:\r\n'
    b'      profile.techAdvantages as CompanyProfileData["techAdvantages"],\r\n'
    b'    scenarios: profile.scenarios as CompanyProfileData["scenarios"],\r\n'
    b'    differentiators:\r\n'
    b'      profile.differentiators as CompanyProfileData["differentiators"],\r\n'
    b'    targetIndustries:\r\n'
    b'      profile.targetIndustries as CompanyProfileData["targetIndustries"],'
)
if old2 not in data:
    print('NOT FOUND: update block')
    raise SystemExit(1)

new2 = (
    b'  revalidatePath("/customer/knowledge/company");\r\n'
    b'  revalidatePath("/customer/radar");\r\n'
    b'\r\n'
    + SYNC_BLOCK +
    b'\r\n'
    b'  return {\r\n'
    b'    id: profile.id,\r\n'
    b'    companyName: profile.companyName,\r\n'
    b'    companyIntro: profile.companyIntro,\r\n'
    b'    coreProducts: profile.coreProducts as CompanyProfileData["coreProducts"],\r\n'
    b'    techAdvantages:\r\n'
    b'      profile.techAdvantages as CompanyProfileData["techAdvantages"],\r\n'
    b'    scenarios: profile.scenarios as CompanyProfileData["scenarios"],\r\n'
    b'    differentiators:\r\n'
    b'      profile.differentiators as CompanyProfileData["differentiators"],\r\n'
    b'    targetIndustries:\r\n'
    b'      profile.targetIndustries as CompanyProfileData["targetIndustries"],'
)

data = data.replace(old2, new2, 1)
print('Added to updateCompanyProfile OK')

with open(path, 'wb') as f:
    f.write(data)
print('Done')
