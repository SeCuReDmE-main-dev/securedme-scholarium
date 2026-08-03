FROM timescale/timescaledb:latest-pg17

COPY timescale/001_telemetry.sql /docker-entrypoint-initdb.d/000_timescale_telemetry.sql
COPY postgres/001_content_catalog.sql /docker-entrypoint-initdb.d/001_content_catalog.sql
COPY postgres/002_dataset_slots.sql /docker-entrypoint-initdb.d/002_dataset_slots.sql
COPY postgres/003_engine_reader.sql /docker-entrypoint-initdb.d/003_engine_reader.sql
COPY postgres/004_engine_reader_password.sh /docker-entrypoint-initdb.d/004_engine_reader_password.sh
