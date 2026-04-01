$file = 'D:\qoder\vertax\src\lib\radar\scan-engine.ts'
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$norm = $content -replace '\r\n', "`n"

$marker = "  // 条款B: upsert 避免竞态，使用 sourceId_externalId 复合键"
$idx = $norm.IndexOf($marker)
if ($idx -lt 0) { Write-Host "Marker not found"; exit 1 }

$guard = "  // 条款B: upsert 避免竞态，使用 sourceId_externalId 复合键`n  // P1-3: externalId 为空时生成 fallback，防止 unique key 碰撞`n  if (!item.externalId) {`n    const rawKey = (item.displayName + '::' + item.sourceUrl).toLowerCase().replace(/\s+/g, '-');`n    const hash = Buffer.from(rawKey).toString('base64url').slice(0, 48);`n    item = { ...item, externalId: 'fallback-' + hash };`n  }`n"

# Replace the marker with guard + marker (insert before)
$newNorm = $norm.Substring(0, $idx) + $guard + $norm.Substring($idx + $marker.Length + 1)
[System.IO.File]::WriteAllText($file, $newNorm, [System.Text.Encoding]::UTF8)
Write-Host "SUCCESS: externalId guard inserted"
