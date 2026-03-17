-- Dochain PostgreSQL initialization
-- This runs once when the container is first created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- for fuzzy text search
CREATE EXTENSION IF NOT EXISTS "unaccent";  -- for accent-insensitive search

-- Create indexes hint (TypeORM will create tables; these are for reference)
-- Full-text search index for doctor names will be created by TypeORM

GRANT ALL PRIVILEGES ON DATABASE dochain_db TO dochain_user;

\echo 'Dochain database initialized successfully';
