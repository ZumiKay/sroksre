-- Initial setup script for PostgreSQL
-- This runs automatically when the container is first created

-- Grant all privileges to the admin user
GRANT ALL PRIVILEGES ON DATABASE sroksre_db TO sroksre_admin;

-- Connect to the database and set up schema permissions
\c sroksre_db

-- Grant schema permissions
GRANT ALL PRIVILEGES ON SCHEMA public TO sroksre_admin;
ALTER SCHEMA public OWNER TO sroksre_admin;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO sroksre_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO sroksre_admin;
