import { readFileSync, writeFileSync } from 'fs';

const path = 'D:/qoder/vertax/src/lib/radar/deep-qualify.ts';
let content = readFileSync(path, 'utf8');

// The exact corrupt string: garbled comment with literal 'n' then code
// Find the position precisely
const marker = '\u793en    await prisma.radarSearchProfile.update({';
const idx = content.indexOf(marker);
if (idx >= 0) {
  // Replace from start of this line's comment back
  const lineStart = content.lastIndexOf('\n', idx) + 1;
  const replacement = '    // Append company name to exclusion list, preserve all other fields\n    await prisma.radarSearchProfile.update({';
  content = content.slice(0, lineStart) + replacement + content.slice(idx + marker.length);
  console.log('Fixed via exact marker');
} else {
  // Try alternate: find 'n    await' and walk back to find start of comment line
  const nAwait = content.indexOf('n    await prisma.radarSearchProfile');
  if (nAwait >= 0) {
    // Find the start of the comment line
    const lineStart = content.lastIndexOf('\n', nAwait) + 1;
    const lineEnd = nAwait + 'n    await prisma.radarSearchProfile.update({'.length;
    const replacement = '    // Append company name to exclusion list, preserve all other fields\n    await prisma.radarSearchProfile.update({';
    content = content.slice(0, lineStart) + replacement + content.slice(lineEnd);
    console.log('Fixed via nAwait search at', nAwait);
  } else {
    console.log('ERROR: could not find pattern');
  }
}

writeFileSync(path, content);

// Verify
const c2 = readFileSync(path, 'utf8');
const lines = c2.split('\n');
console.log('\nLines 446-462:');
lines.slice(445, 463).forEach((l, i) => console.log(446+i, '|', l));
