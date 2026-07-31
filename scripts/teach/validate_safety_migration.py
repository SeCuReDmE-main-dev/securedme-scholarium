from __future__ import annotations

import sqlite3
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MIGRATIONS = ROOT / "apps" / "web" / "drizzle"
REQUIRED_TABLES = {
    "teach_school_safety_policies",
    "teach_school_safety_evidence",
    "teach_school_safety_cases",
    "teach_school_safety_assignments",
    "teach_school_safety_events",
    "teach_school_safety_appeals",
    "teach_school_safety_outbox",
}
REQUIRED_TRIGGERS = {
    "teach_school_safety_events_no_update",
    "teach_school_safety_events_no_delete",
}

def expect_database_error(action, expected: type[sqlite3.Error]) -> None:
    try:
        action()
    except expected:
        return
    raise AssertionError(f"Expected {expected.__name__}")


def seed_legacy_report(connection: sqlite3.Connection) -> None:
    connection.execute(
        "INSERT INTO users (id, email, display_name, primary_role) VALUES (?, ?, ?, ?)",
        ("fixture-user", "fixture@example.invalid", "Synthetic Fixture", "student"),
    )
    connection.execute(
        "INSERT INTO organizations (id, name, kind, verification_status) VALUES (?, ?, ?, ?)",
        ("fixture-organization", "Synthetic School", "school", "synthetic"),
    )
    connection.execute(
        "INSERT INTO publications (id, author_id, type, title, abstract, visibility, verification_status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ("fixture-publication", "fixture-user", "article", "Synthetic fixture", "No real learner data.", "public", "verified"),
    )
    connection.execute(
        "INSERT INTO interaction_reports (id, reporter_id, publication_id, reason, details) VALUES (?, ?, ?, ?, ?)",
        ("fixture-report", "fixture-user", "fixture-publication", "unsafe", "Synthetic pre-migration report."),
    )


def prove_constraints(connection: sqlite3.Connection) -> dict[str, bool]:
    now = "2026-07-31T12:00:00.000Z"
    connection.execute(
        "INSERT INTO teach_school_safety_policies "
        "(id, organization_id, version, status, data_mode, created_by_user_id, created_at, activated_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ("fixture-policy", "fixture-organization", "synthetic-v1", "active", "synthetic_only", "fixture-user", now, now),
    )
    expect_database_error(lambda: connection.execute(
        "INSERT INTO teach_school_safety_policies "
        "(id, organization_id, version, status, data_mode, created_by_user_id, created_at, activated_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ("fixture-policy-2", "fixture-organization", "synthetic-v2", "active", "synthetic_only", "fixture-user", now, now),
    ), sqlite3.IntegrityError)
    connection.execute(
        "INSERT INTO teach_school_safety_evidence "
        "(id, organization_id, owner_user_id, kind, content, content_sha256, content_type, size_bytes, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ("fixture-evidence", "fixture-organization", "fixture-user", "initial_report", "Synthetic evidence only.", "a" * 64, "text/plain", 24, now),
    )
    connection.execute(
        "INSERT INTO teach_school_safety_cases "
        "(id, organization_id, reporter_user_id, reporter_role, evidence_id, source_report_id, subject_type, subject_id, category, proposed_severity, status, policy_version, telemetry_status, version, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ("fixture-case", "fixture-organization", "fixture-user", "student", "fixture-evidence", "fixture-report", "publication", "fixture-publication", "unsafe", "standard", "received", "synthetic-v1", "disabled", 1, now, now),
    )
    connection.execute(
        "INSERT INTO teach_school_safety_events "
        "(id, case_id, sequence, actor_user_id, actor_role, from_state, to_state, rationale_code, rationale_digest, previous_hash, event_hash, idempotency_key, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ("fixture-event", "fixture-case", 1, "fixture-user", "student", None, "received", "report_received", "b" * 64, "GENESIS", "c" * 64, "d" * 64, now),
    )
    expect_database_error(
        lambda: connection.execute("UPDATE teach_school_safety_events SET to_state='closed' WHERE id='fixture-event'"),
        sqlite3.IntegrityError,
    )
    expect_database_error(
        lambda: connection.execute("DELETE FROM teach_school_safety_events WHERE id='fixture-event'"),
        sqlite3.IntegrityError,
    )
    connection.execute(
        "INSERT INTO teach_school_safety_appeals "
        "(id, case_id, appellant_user_id, evidence_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        ("fixture-appeal", "fixture-case", "fixture-user", "fixture-evidence", "pending", now),
    )
    expect_database_error(lambda: connection.execute(
        "INSERT INTO teach_school_safety_appeals "
        "(id, case_id, appellant_user_id, evidence_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        ("fixture-appeal-2", "fixture-case", "fixture-user", "fixture-evidence", "pending", now),
    ), sqlite3.IntegrityError)
    connection.execute(
        "INSERT INTO teach_school_safety_outbox "
        "(id, case_id, event_id, operation, redacted_payload, idempotency_key, status, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ("fixture-outbox", "fixture-case", "fixture-event", "create", '{"schema":"fixture.redacted.v1"}', "fixture-idempotency", "disabled", now, now),
    )
    expect_database_error(lambda: connection.execute(
        "INSERT INTO teach_school_safety_outbox "
        "(id, case_id, event_id, operation, redacted_payload, idempotency_key, status, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ("fixture-outbox-2", "fixture-case", "fixture-event", "create", '{"schema":"fixture.redacted.v1"}', "fixture-idempotency", "disabled", now, now),
    ), sqlite3.IntegrityError)
    expect_database_error(lambda: connection.execute(
        "INSERT INTO teach_school_safety_cases "
        "(id, organization_id, reporter_user_id, reporter_role, evidence_id, subject_type, category, proposed_severity, status, policy_version) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ("invalid-case", "fixture-organization", "fixture-user", "student", "missing-evidence", "general", "other", "standard", "received", "synthetic-v1"),
    ), sqlite3.IntegrityError)
    return {
        "active_policy_unique": True,
        "append_only": True,
        "foreign_keys": True,
        "idempotency_unique": True,
        "pending_appeal_unique": True,
    }


def main() -> None:
    migrations = sorted(MIGRATIONS.glob("*.sql"))
    with tempfile.TemporaryDirectory(prefix="scholarium-safety-") as directory:
        database = Path(directory) / "migration.sqlite"
        connection = sqlite3.connect(database)
        try:
            connection.execute("PRAGMA foreign_keys=ON")
            legacy_seeded = False
            for migration in migrations:
                if migration.name == "0035_teach_school_safety_cases.sql":
                    seed_legacy_report(connection)
                    legacy_seeded = True
                connection.executescript(migration.read_text(encoding="utf-8"))
            tables = {row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            triggers = {row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type='trigger'")}
            missing_tables = REQUIRED_TABLES - tables
            missing_triggers = REQUIRED_TRIGGERS - triggers
            integrity = connection.execute("PRAGMA integrity_check").fetchone()[0]
            if missing_tables or missing_triggers or integrity != "ok":
                raise SystemExit({
                    "missing_tables": sorted(missing_tables),
                    "missing_triggers": sorted(missing_triggers),
                    "integrity": integrity,
                })
            if not legacy_seeded or connection.execute(
                "SELECT COUNT(*) FROM interaction_reports WHERE id='fixture-report'"
            ).fetchone()[0] != 1:
                raise AssertionError("Legacy interaction report was not preserved")
            constraints = prove_constraints(connection)
            print({
                "status": "success",
                "migration_count": len(migrations),
                "required_table_count": len(REQUIRED_TABLES),
                "append_only_trigger_count": len(REQUIRED_TRIGGERS),
                "legacy_report_preserved": True,
                "constraints": constraints,
                "integrity": integrity,
            })
        finally:
            connection.close()


if __name__ == "__main__":
    main()
