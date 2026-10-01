-- Additive only. Existing private cases and append-only decisions are retained.
-- Legacy retries without a binding are refused until reviewed, never guessed.
ALTER TABLE teach_school_safety_outbox ADD COLUMN request_digest TEXT;
