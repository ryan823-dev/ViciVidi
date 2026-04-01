import { readFileSync, writeFileSync } from 'fs';

const path = 'D:/qoder/vertax/src/lib/radar/deep-qualify.ts';
let content = readFileSync(path, 'utf8');

// The corrupt line contains garbled Chinese + literal 'n    await' (the \n got mangled)
// Replace the entire corrupt section with correct code
const badComment1 = /    \/\/ [\u4e00-\u9fff\uff00-\uffef]+n    await prisma\.radarSearchProfile\.update\(\{/;
content = content.replace(badComment1,
  '    // Append company name to exclusion list, preserve all other fields\n    await prisma.radarSearchProfile.update({');

const badComment2 = /  } catch \{\n    \/\/ [\u4e00-\u9fff\uff00-\uffef]+n  \}/;
content = content.replace(badComment2,
  '  } catch {\n    // Silent failure \u2014 does not affect main flow\n  }');

writeFileSync(path, content);
console.log('Done. Checking for remaining issues...');

// Verify no literal 'n    await' remains
if (content.includes('n    await')) {
  console.log('WARNING: still has merged line');
} else {
  console.log('OK: no merged lines found');
}
