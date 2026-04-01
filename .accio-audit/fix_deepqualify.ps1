$file = 'D:\qoder\vertax\src\lib\radar\deep-qualify.ts'
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$contentNorm = $content -replace '\r\n', "`n"

$startMarker = "// ==================== Feedback Loop ===================="
$startIdx = $contentNorm.IndexOf($startMarker)
if ($startIdx -lt 0) { Write-Host "Marker not found"; exit 1 }

$before = $contentNorm.Substring(0, $startIdx)

$newSection = "// ==================== Feedback Loop ====================`n`nasync function appendExclusionFeedback(`n  profileId: string,`n  result: DeepQualifyResult,`n): Promise<void> {`n  try {`n    // 从数据库读取候选公司名`n    const candidate = await prisma.radarCandidate.findUnique({`n      where: { id: result.id },`n      select: { displayName: true },`n    });`n    if (!candidate?.displayName) return;`n`n    const profile = await prisma.radarSearchProfile.findUnique({`n      where: { id: profileId },`n      select: { exclusionRules: true },`n    });`n`n    const rules = (profile?.exclusionRules as {`n      excludedCompanies?: string[];`n      excludedPatterns?: string[];`n      negativeKeywords?: string[];`n    }) || {};`n`n    const excludedCompanies = rules.excludedCompanies || [];`n    const MAX_EXCLUSIONS = 200;`n    if (excludedCompanies.length >= MAX_EXCLUSIONS) return;`n`n    // 追加公司名到排除列表，保留所有其他字段`n    await prisma.radarSearchProfile.update({`n      where: { id: profileId },`n      data: {`n        exclusionRules: {`n          ...rules,`n          excludedCompanies: [...new Set([...excludedCompanies, candidate.displayName])].slice(0, MAX_EXCLUSIONS),`n        } as object,`n      },`n    });`n  } catch {`n    // 静默失败，不影响主流程`n  }`n}`n"

$newContent = $before + $newSection
[System.IO.File]::WriteAllText($file, $newContent, [System.Text.Encoding]::UTF8)
Write-Host "SUCCESS: appendExclusionFeedback fixed"
