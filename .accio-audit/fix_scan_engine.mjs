import { readFileSync, writeFileSync } from 'fs';

const file = 'D:/qoder/vertax/src/lib/radar/scan-engine.ts';
let content = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

const marker = '  // 条款B: upsert 避免竞态，使用 sourceId_externalId 复合键';
const idx = content.indexOf(marker);
if (idx < 0) { console.error('Marker not found'); process.exit(1); }

const guard = [
  '  // 条款B: upsert 避免竞态，使用 sourceId_externalId 复合键',
  '  // P1-3: externalId 为空时生成 fallback，防止 unique key 碰撞导致数据覆盖',
  '  if (!item.externalId) {',
  "    const rawKey = (item.displayName + '::' + item.sourceUrl).toLowerCase().replace(/\\s+/g, '-');",
  "    const hash = Buffer.from(rawKey).toString('base64url').slice(0, 48);",
  "    item = { ...item, externalId: 'fallback-' + hash };",
  '  }',
  '',
].join('\n');

// Replace marker with guard (guard already contains the marker as its first line)
content = content.slice(0, idx) + guard + content.slice(idx + marker.length);

writeFileSync(file, content, 'utf8');
console.log('SUCCESS: externalId fallback guard added to scan-engine.ts');
