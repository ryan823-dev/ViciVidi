import { readFileSync, writeFileSync } from 'fs';

// Fix knowledge.ts
const kPath = 'D:/qoder/vertax/src/actions/knowledge.ts';
let k = readFileSync(kPath, 'utf8');
const kBefore = (k.match(/revalidatePath/g) || []).length;
k = k.replaceAll('revalidatePath("/zh-CN/knowledge")', 'revalidatePath("/customer/knowledge/company")');
writeFileSync(kPath, k);
console.log(`knowledge.ts: ${kBefore} -> ${(k.match(/revalidatePath/g) || []).length} calls`);

// Fix personas.ts
const pPath = 'D:/qoder/vertax/src/actions/personas.ts';
let p = readFileSync(pPath, 'utf8');
const pBefore = (p.match(/revalidatePath/g) || []).length;
p = p.replaceAll('revalidatePath("/zh-CN/knowledge")', 'revalidatePath("/customer/knowledge/profiles")');
writeFileSync(pPath, p);
console.log(`personas.ts: ${pBefore} -> ${(p.match(/revalidatePath/g) || []).length} calls`);
