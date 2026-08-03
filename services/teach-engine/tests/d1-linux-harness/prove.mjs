import { rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const state = ".state";
const wrangler = join(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "wrangler.cmd" : "wrangler");

function run(args, expected = 0) {
  const result = spawnSync(wrangler, args, { encoding: "utf8", shell: process.platform === "win32" });
  if (result.error || result.status !== expected) {
    throw new Error(`wrangler ${args.join(" ")} returned ${result.status}: ${result.error?.message || result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function sql(statement, expected = 0) {
  return run(["d1", "execute", "scholarium-teach-proof", "--config", "wrangler.jsonc", "--local", "--persist-to", state, "--command", statement, "--json"], expected);
}

try {
  rmSync(state, { recursive: true, force: true });
  run(["d1", "migrations", "apply", "scholarium-teach-proof", "--config", "wrangler.jsonc", "--local", "--persist-to", state]);
  sql("INSERT INTO users (id,email,display_name,primary_role) VALUES ('synthetic-learner','synthetic@example.invalid','Synthetic learner','learner')");
  sql("INSERT INTO teach_engine_sessions (id,user_id,block_id,block_version,block_digest,policy_digest,checkpoint_json,checkpoint_digest) VALUES ('session-1','synthetic-learner','castellano','1.0.0','block-digest','policy-digest','{}','checkpoint-a')");
  sql("INSERT INTO teach_engine_attempts (id,session_id,user_id,idempotency_key,request_digest,node_id,receipt_id,expected_checkpoint_digest) VALUES ('attempt-1','session-1','synthetic-learner','key-1','request-digest','syllable-ma','receipt-1','checkpoint-a')");
  sql("INSERT INTO teach_engine_organization_aggregates (id,organization_scope,metric_key,time_bucket,cohort_size,value_integer,source_window_digest) VALUES ('aggregate-1','synthetic-org','decision_count','2026-08-02T00:00:00Z',10,1,'digest')");
  sql("INSERT INTO teach_engine_organization_aggregates (id,organization_scope,metric_key,time_bucket,cohort_size,value_integer,source_window_digest) VALUES ('aggregate-rejected','synthetic-org','decision_count','2026-08-02T00:00:00Z',9,1,'digest')", 1);
  sql("INSERT INTO teach_engine_attempts (id,session_id,user_id,idempotency_key,request_digest,node_id,receipt_id,expected_checkpoint_digest) VALUES ('attempt-conflict','session-1','synthetic-learner','key-2','request-digest','syllable-ma','receipt-2','wrong-digest')", 1);
  console.log(JSON.stringify({ status: "passed", runtime: process.platform, synthetic_identity_only: true }));
} finally {
  rmSync(state, { recursive: true, force: true });
}
