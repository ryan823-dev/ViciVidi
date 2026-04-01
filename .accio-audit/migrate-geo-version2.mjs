import { readFileSync } from 'fs';

// manually load .env
const envContent = readFileSync('.env', 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx < 0) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[key]) process.env[key] = val;
}

const { default: pg } = await import('pg');
const { Client } = pg;

const url = process.env.DATABASE_URL;
if (!url) { console.error('No DATABASE_URL'); process.exit(1); }
console.log('Connecting to:', url.replace(/:([^:@]+)@/, ':[HIDDEN]@'));

const client = new Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log('Connected.');
  
  await client.query('ALTER TABLE "SeoContent" ADD COLUMN IF NOT EXISTS "geoVersion" TEXT');
  console.log('ALTER TABLE: OK');

  const check = await client.query(
    `SELECT column_name, data_type FROM information_schema.columns 
     WHERE table_name = 'SeoContent' AND column_name = 'geoVersion'`
  );
  if (check.rows.length > 0) {
    console.log('Column verified:', check.rows[0]);
  } else {
    console.log('WARNING: column not found after migration');
  }
} catch (err) {
  console.error('ERROR:', err.message);
} finally {
  await client.end();
  console.log('Done.');
}
