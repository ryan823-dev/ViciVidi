import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  const res = await client.query(
    'ALTER TABLE "SeoContent" ADD COLUMN IF NOT EXISTS "geoVersion" TEXT'
  );
  console.log('Migration OK:', res.command);

  // Also add a migration record to _prisma_migrations if it exists
  const checkResult = await client.query(
    `SELECT column_name FROM information_schema.columns 
     WHERE table_name = 'SeoContent' AND column_name = 'geoVersion'`
  );
  console.log('Column exists:', checkResult.rows.length > 0);
} catch (err) {
  console.error('Migration failed:', err.message);
} finally {
  await client.end();
}
