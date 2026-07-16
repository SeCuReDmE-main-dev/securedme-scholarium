import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { backup, DatabaseSync } from "node:sqlite";

const [sourceArgument, destinationArgument] = process.argv.slice(2);
if (!sourceArgument || !destinationArgument) throw new Error("source and destination paths are required");

const source = resolve(sourceArgument);
const destination = resolve(destinationArgument);
if (source === destination) throw new Error("source and destination must differ");
await mkdir(dirname(destination), { recursive: true });

const sourceDatabase = new DatabaseSync(source, { readOnly: true });
try {
  await backup(sourceDatabase, destination);
} finally {
  sourceDatabase.close();
}

const restored = new DatabaseSync(destination, { readOnly: true });
try {
  const quickCheck = restored.prepare("PRAGMA quick_check").get();
  const applicationTables = restored.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name <> 'd1_migrations'").get();
  const migrationTable = restored.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name='d1_migrations'").get();
  const appliedMigrations = Number(migrationTable.count) === 1
    ? restored.prepare("SELECT COUNT(*) AS count FROM d1_migrations").get().count
    : 0;
  console.log(JSON.stringify({
    schema: "scholarium.local-d1-backup-result.v1",
    quickCheck: quickCheck.quick_check,
    applicationTables: Number(applicationTables.count),
    appliedMigrations: Number(appliedMigrations),
  }));
} finally {
  restored.close();
}
