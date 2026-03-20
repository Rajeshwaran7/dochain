import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '5432', 10);
const DB_USERNAME = process.env.DB_USERNAME || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'root';
const DB_NAME = process.env.DB_NAME || 'doc_db';

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    host: DB_HOST,
    port: DB_PORT,
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  await ds.initialize();
  console.log('Connected to database');

  const email = process.env.ADMIN_SEED_EMAIL ?? 'admin@dochain.in';
  const plainPassword = process.env.ADMIN_SEED_PASSWORD ?? 'Admin@123456';
  const existing = await ds.query('SELECT id FROM users WHERE email = $1', [email]);

  if (existing.length > 0) {
    console.log(`Admin user already exists (${email}), skipping.`);
  } else {
    const hashedPassword = await bcrypt.hash(plainPassword, 12);
    await ds.query(
      `INSERT INTO users (id, email, password, "firstName", "lastName", role, "isActive", "isEmailVerified", provider, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, true, 'local', NOW(), NOW())`,
      [email, hashedPassword, 'Admin', 'Dochain', 'admin'],
    );
    console.log('Admin user created successfully!');
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${plainPassword}`);
  }

  await ds.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
