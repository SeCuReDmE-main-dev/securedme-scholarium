CREATE SCHEMA IF NOT EXISTS teach_catalog;

CREATE TABLE IF NOT EXISTS teach_catalog.content_packs (
  block_id text NOT NULL,
  version text NOT NULL,
  content_digest text NOT NULL CHECK (content_digest ~ '^sha256:[a-f0-9]{64}$'),
  policy_digest text NOT NULL CHECK (policy_digest ~ '^sha256:[a-f0-9]{64}$'),
  locale text NOT NULL,
  manifest jsonb NOT NULL,
  status text NOT NULL CHECK (status IN ('published', 'revoked')),
  published_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (block_id, version),
  UNIQUE (content_digest)
);

CREATE TABLE IF NOT EXISTS teach_catalog.learning_nodes (
  block_id text NOT NULL,
  block_version text NOT NULL,
  node_id text NOT NULL,
  position integer NOT NULL CHECK (position >= 0),
  kind text NOT NULL CHECK (kind IN ('syllable','sound','composition','reading','writing')),
  prerequisites text[] NOT NULL DEFAULT '{}',
  prompt text NOT NULL,
  target text NOT NULL,
  syllables text[] NOT NULL,
  search_document tsvector GENERATED ALWAYS AS (to_tsvector('simple'::regconfig, prompt || ' ' || target)) STORED,
  PRIMARY KEY (block_id, block_version, node_id),
  FOREIGN KEY (block_id, block_version) REFERENCES teach_catalog.content_packs(block_id, version)
);
CREATE UNIQUE INDEX IF NOT EXISTS learning_nodes_position_idx ON teach_catalog.learning_nodes(block_id, block_version, position);
CREATE INDEX IF NOT EXISTS learning_nodes_prerequisites_idx ON teach_catalog.learning_nodes USING gin(prerequisites);
CREATE INDEX IF NOT EXISTS learning_nodes_search_idx ON teach_catalog.learning_nodes USING gin(search_document);

REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA teach_catalog FROM PUBLIC;
