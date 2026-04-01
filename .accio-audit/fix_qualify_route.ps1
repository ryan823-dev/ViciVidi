$file = 'D:\qoder\vertax\src\app\api\cron\radar-qualify\route.ts'
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$norm = $content -replace '\r\n', "`n"

# P0-2: Fix negativeKeywords being reset to []
$old2 = "        exclusionRules: {`n          negativeKeywords: [],`n          excludedCompanies: [...new Set([...existingComp, displayName])].slice(0, MAX_EXCLUSIONS),`n        } as object,"
$new2 = "        exclusionRules: {`n          ...existingRules,`n          excludedCompanies: [...new Set([...existingComp, displayName])].slice(0, MAX_EXCLUSIONS),`n        } as object,"

if ($norm.Contains($old2)) {
    $norm = $norm.Replace($old2, $new2)
    Write-Host "P0-2 fixed: negativeKeywords preserved"
} else {
    Write-Host "P0-2 WARN: pattern not found, checking..."
    $idx = $norm.IndexOf("negativeKeywords: []")
    Write-Host "negativeKeywords:[] found at:" $idx
}

# P0-3: Fix stage2_enriching counting excluded instead of qualified
$old3 = "            stats.stage2_enriching += applyResult.excluded; // reuse for enriching count"
$new3 = "            stats.stage2_enriching += applyResult.updated; // candidates entering ENRICHING or QUALIFIED"

if ($norm.Contains($old3)) {
    $norm = $norm.Replace($old3, $new3)
    Write-Host "P0-3 fixed: stage2_enriching now counts updated (not excluded)"
} else {
    Write-Host "P0-3 WARN: pattern not found"
    $idx = $norm.IndexOf("stage2_enriching")
    Write-Host "stage2_enriching found at:" $idx
    Write-Host $norm.Substring($idx, 120)
}

[System.IO.File]::WriteAllText($file, $norm, [System.Text.Encoding]::UTF8)
Write-Host "Done"
