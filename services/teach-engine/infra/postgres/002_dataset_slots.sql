CREATE TABLE IF NOT EXISTS teach_catalog.dataset_slots (
  slot_id text PRIMARY KEY,
  version text NOT NULL CHECK (version ~ '^\d+\.\d+\.\d+$'),
  status text NOT NULL CHECK (status IN ('neutral', 'ready_for_research', 'active', 'retired')),
  purpose text NOT NULL,
  runtime_access boolean NOT NULL DEFAULT false CHECK (runtime_access = false)
);

INSERT INTO teach_catalog.dataset_slots (slot_id, version, status, purpose, runtime_access) VALUES
  ('dataset-slot-1', '1.0.0', 'neutral', 'Reserved pending research, source review, and license approval.', false),
  ('dataset-slot-2', '1.0.0', 'neutral', 'Reserved pending research, source review, and license approval.', false),
  ('dataset-slot-3', '1.0.0', 'neutral', 'Reserved pending research, source review, and license approval.', false),
  ('dataset-slot-4', '1.0.0', 'neutral', 'Reserved pending research, source review, and license approval.', false),
  ('dataset-slot-5', '1.0.0', 'neutral', 'Reserved pending research, source review, and license approval.', false)
ON CONFLICT (slot_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS teach_catalog.license_records (
  license_id text PRIMARY KEY,
  name text NOT NULL,
  url text NOT NULL,
  allows_derivatives boolean NOT NULL,
  allows_redistribution boolean NOT NULL,
  commercial_use_known boolean NOT NULL,
  reviewed_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teach_catalog.source_records (
  source_id text PRIMARY KEY,
  source_url text NOT NULL,
  retrieved_at timestamptz NOT NULL,
  author text,
  license_id text NOT NULL REFERENCES teach_catalog.license_records(license_id),
  source_sha256 text NOT NULL CHECK (source_sha256 ~ '^sha256:[a-f0-9]{64}$')
);

CREATE TABLE IF NOT EXISTS teach_catalog.corpus_shards (
  shard_id text PRIMARY KEY,
  slot_id text NOT NULL REFERENCES teach_catalog.dataset_slots(slot_id),
  source_id text NOT NULL REFERENCES teach_catalog.source_records(source_id),
  content_sha256 text NOT NULL UNIQUE CHECK (content_sha256 ~ '^sha256:[a-f0-9]{64}$'),
  compression text NOT NULL CHECK (compression IN ('none', 'gzip', 'zstd', 'zip')),
  mime_type text NOT NULL,
  language_tag text NOT NULL,
  bytes_uncompressed bigint NOT NULL CHECK (bytes_uncompressed >= 0 AND bytes_uncompressed <= 10737418240),
  bytes_compressed bigint NOT NULL CHECK (bytes_compressed >= 0 AND bytes_compressed <= 10737418240),
  intake_status text NOT NULL CHECK (intake_status IN ('accepted', 'rejected', 'quarantined')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS corpus_shards_slot_status_idx ON teach_catalog.corpus_shards(slot_id, intake_status);

CREATE VIEW teach_catalog.editorially_approved_pack_sources AS
SELECT shard_id, slot_id, source_id, content_sha256, mime_type, language_tag
FROM teach_catalog.corpus_shards
JOIN teach_catalog.dataset_slots USING (slot_id)
WHERE intake_status = 'accepted' AND status = 'active' AND runtime_access = false;
