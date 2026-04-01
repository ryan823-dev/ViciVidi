import { readFileSync, writeFileSync } from 'fs';

const path = 'D:/qoder/vertax/src/lib/radar/deep-qualify.ts';
let content = readFileSync(path, 'utf8');

// The garbled section: corrupt Chinese comment ending with \u79b0 then literal 'n    await'
// Replace with clean version
const corruptStr = '\u79b0n    await prisma.radarSearchProfile.update({';
const fixedStr = '\n    await prisma.radarSearchProfile.update({';

if (content.includes(corruptStr)) {
  content = content.replace(corruptStr, fixedStr);
  console.log('Fixed corrupt line 1');
} else {
  console.log('Pattern 1 not found, scanning...');
  // Find where 'n    await' occurs
  const idx = content.indexOf('礰n    await');
  if (idx >= 0) {
    console.log('Found at', idx, ':', JSON.stringify(content.slice(idx-5, idx+20)));
  }
}

// Fix the comment preceding the await (strip the garbled Chinese and replace with clean comment)
// Find any line matching: "    // <garbled>" (line ending with n on same line as next statement)
// Strategy: remove everything from '    // ' to '礰n' and replace with just a newline+comment
content = content.replace(/    \/\/ [\u3400-\u9fff\uff00-\uffef\u2e80-\u2eff]{3,}礰\n/g, 
  '    // Append company name to exclusion list, preserve all other fields\n');

// Fix the second corrupt comment (catch block)
const corrupt2 = content.indexOf('绋媊n  }');
if (corrupt2 >= 0) {
  content = content.slice(0, corrupt2) + '\n  }' + content.slice(corrupt2 + '绋媊n  }'.length);
  console.log('Fixed corrupt line 2');
}

writeFileSync(path, content);

// Verify
const c2 = readFileSync(path, 'utf8');
const lines = c2.split('\n');
lines.slice(445, 465).forEach((l, i) => console.log(446+i, '|', l));
