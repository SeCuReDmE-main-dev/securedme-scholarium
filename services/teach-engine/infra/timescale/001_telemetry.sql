CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE SCHEMA IF NOT EXISTS teach_telemetry;

CREATE TABLE IF NOT EXISTS teach_telemetry.engine_events (
  occurred_at timestamptz NOT NULL,
  event_id text NOT NULL,
  event_type text NOT NULL,
  block_id text NOT NULL,
  block_version text NOT NULL,
  decision_digest text,
  latency_ms integer NOT NULL CHECK (latency_ms >= 0),
  error_code text,
  contains_identity boolean NOT NULL DEFAULT false CHECK (contains_identity = false),
  contains_raw_answer boolean NOT NULL DEFAULT false CHECK (contains_raw_answer = false),
  contains_audio boolean NOT NULL DEFAULT false CHECK (contains_audio = false),
  PRIMARY KEY (occurred_at, event_id)
);
SELECT create_hypertable('teach_telemetry.engine_events', by_range('occurred_at'), if_not_exists => true);
ALTER TABLE teach_telemetry.engine_events SET (timescaledb.compress, timescaledb.compress_orderby = 'occurred_at DESC', timescaledb.compress_segmentby = 'block_id,block_version,event_type');
SELECT add_compression_policy('teach_telemetry.engine_events', INTERVAL '7 days', if_not_exists => true);
SELECT add_retention_policy('teach_telemetry.engine_events', INTERVAL '90 days', if_not_exists => true);

CREATE MATERIALIZED VIEW IF NOT EXISTS teach_telemetry.engine_hourly
WITH (timescaledb.continuous) AS
SELECT time_bucket(INTERVAL '1 hour', occurred_at) AS bucket, block_id, block_version, event_type,
       count(*) AS event_count, percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS latency_p95
FROM teach_telemetry.engine_events
GROUP BY bucket, block_id, block_version, event_type
WITH NO DATA;
SELECT add_continuous_aggregate_policy('teach_telemetry.engine_hourly', start_offset => INTERVAL '3 days', end_offset => INTERVAL '5 minutes', schedule_interval => INTERVAL '15 minutes', if_not_exists => true);

