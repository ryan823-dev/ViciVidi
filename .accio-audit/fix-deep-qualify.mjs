import { readFileSync, writeFileSync } from 'fs';

const path = 'D:/qoder/vertax/src/lib/radar/deep-qualify.ts';
let content = readFileSync(path, 'utf8');
const lines = content.split('\n');

// Fix line 449 (index 448): split the merged comment + code line
// The garbled comment + 'n    await ...' should become:
// '    // append company name to exclusion list, preserve all other fields'
// '    await prisma...'
lines[448] = '    // Append company name to exclusion list, preserve all other fields';
// Insert the await line after it (was merged into line 449)
// But the await line is now on the same line after the garbled 'n'
// We need to split it: extract the await part
const awaitMatch = lines[448].match(/n\s+(await prisma\.radarSearchProfile\.update\(\{.*)/);
if (awaitMatch) {
  // Already confirmed structure from raw output - the garbled line has the await on same line
  lines.splice(449, 0, '    ' + awaitMatch[1]);
  lines[448] = '    // Append company name to exclusion list, preserve all other fields';
}

// Fix line 459 (index 458, or 459 after splice): the garbled silent-fail comment + '  }'
// Find and fix it
for (let i = 455; i < lines.length; i++) {
  if (lines[i].includes('} catch {') || (lines[i].match(/^  }\s*$/) && lines[i-1] && lines[i-1].includes('绋媊'))) {
    // skip - we'll handle the catch line below
  }
  if (lines[i].includes('绋媊')) {
    // this is the merged comment + closing brace line
    lines.splice(i, 1, '    // Silent failure — does not affect main flow', '  }');
    break;
  }
}

writeFileSync(path, lines.join('\n'));
console.log('Fixed. Lines around 448-462:');
lines.slice(445, 463).forEach((l, i) => console.log(446 + i, '|', l));
