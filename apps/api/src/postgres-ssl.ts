/**
 * Returns TypeORM/pg SSL options for Postgres when using hosted TLS (e.g. Neon).
 */
export function postgresSslFromEnv(): false | { rejectUnauthorized: boolean } {
  const host = process.env.DB_HOST ?? '';
  const useSsl =
    process.env.NODE_ENV === 'production' ||
    process.env.DB_SSL === 'true' ||
    host.includes('neon.tech');
  return useSsl ? { rejectUnauthorized: false } : false;
}
