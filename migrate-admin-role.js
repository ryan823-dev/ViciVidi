const { Client } = require('pg');

const client = new Client({
  host: 'db.vdzaqvmzzwtzuozozhzd.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'xZR9V0IR2uqYGQCe',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Add role column
    const addColumn = await client.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user';
    `);
    console.log('Added role column:', addColumn.command);
    
    // Set admin role for the specified user
    const updateAdmin = await client.query(`
      UPDATE "users" SET role = 'admin' WHERE email = 'congrenmao799@gmail.com';
    `);
    console.log('Updated admin user, rows affected:', updateAdmin.rowCount);
    
    // Verify the update
    const verify = await client.query(`
      SELECT email, role FROM "users" WHERE email = 'congrenmao799@gmail.com';
    `);
    console.log('Admin user verification:', verify.rows[0]);
    
    await client.end();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();
