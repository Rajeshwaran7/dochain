import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { postgresSslFromEnv } from './postgres-ssl';

async function check() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'doc_db',
    ssl: postgresSslFromEnv(),
  });

  await ds.initialize();

  const rows = await ds.query(
    `SELECT id, email, password, role, "isActive" FROM users WHERE email = $1`,
    ['admin@dochain.in'],
  );

  if (rows.length === 0) {
    console.log('ERROR: Admin user NOT found in database!');
  } else {
    const user = rows[0];
    console.log('Admin user found:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Active:', user.isActive);
    console.log('  Has password:', !!user.password);
    console.log('  Password hash:', user.password?.substring(0, 20) + '...');

    const match = await bcrypt.compare('Admin@123456', user.password);
    console.log('  Password "Admin@123456" matches:', match);
  }

  await ds.destroy();
}

check().catch(console.error);
