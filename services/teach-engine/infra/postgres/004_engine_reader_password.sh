#!/usr/bin/env sh
set -eu

psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  --set=reader_password="$SCHOLARIUM_ENGINE_READER_PASSWORD" <<'SQL'
ALTER ROLE scholarium_engine_reader PASSWORD :'reader_password';
SQL
