DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'scholarium_engine_reader') THEN
    CREATE ROLE scholarium_engine_reader LOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA teach_catalog TO scholarium_engine_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA teach_catalog TO scholarium_engine_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA teach_catalog GRANT SELECT ON TABLES TO scholarium_engine_reader;
