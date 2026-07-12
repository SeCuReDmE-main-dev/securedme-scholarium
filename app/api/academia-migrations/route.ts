import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { academiaMigrationItems, academiaMigrations, moderationCases, publicationRelationships, publicationTopics, publicationVersions, publications, publicProfiles, topics, users } from "../../../db/schema";
import { academiaImportItems, academyProfileUrl, privateOrPublic } from "../../../lib/academia-migration";
import { accountAudience } from "../../../lib/account-audience";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";
import { createProvenanceReceipt } from "../../../lib/provenance";
import { publicationSafetyDecision } from "../../../lib/publication-safety";
import { topicLabel } from "../../../lib/topics";

type DraftInput = { action?: "draft"; items?: unknown; sourceOwnershipConfirmed?: unknown; sourceProfileUrl?: unknown };
type CommitInput = { action?: "commit"; migrationId?: unknown; selections?: unknown };

function jsonTopics(value: string) {
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []; } catch { return []; }
}

async function ownerAccount() {
  const identity = await getPlatformIdentity();
  if (!identity) return { identity: null, db: null, user: null };
  const db = await getDb();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
  return { identity, db, user };
}

export async function GET() {
  try {
    const account = await ownerAccount();
    if (!account.identity) return signInRequired();
    if (!account.user || !account.db) return Response.json({ error: "Create your Scholarium profile before importing work." }, { status: 404 });
    const migrations = await account.db.select().from(academiaMigrations).where(eq(academiaMigrations.userId, account.user.id));
    const ids = migrations.map((migration) => migration.id);
    const items = ids.length ? await account.db.select().from(academiaMigrationItems).where(inArray(academiaMigrationItems.migrationId, ids)) : [];
    return Response.json({ migrations: migrations.map((migration) => ({ ...migration, items: items.filter((item) => item.migrationId === migration.id).map((item) => ({ ...item, topicSlugs: jsonTopics(item.topicSlugs) })) })) }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load Academia migration drafts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const input = await request.json() as DraftInput & CommitInput;
    const account = await ownerAccount();
    if (!account.identity) return signInRequired();
    if (!account.user || !account.db) return Response.json({ error: "Create your Scholarium profile before importing work." }, { status: 404 });
    const db = account.db;
    if (input.action !== "commit") {
      if (input.sourceOwnershipConfirmed !== true) return Response.json({ error: "Confirm that you own or are authorized to import this Academia.edu profile." }, { status: 400 });
      const sourceProfileUrl = academyProfileUrl(input.sourceProfileUrl);
      const items = academiaImportItems(input.items);
      const now = new Date().toISOString();
      const migrationId = crypto.randomUUID();
      await db.batch([
        db.insert(academiaMigrations).values({ id: migrationId, userId: account.user.id, sourceProfileUrl, ownershipConfirmedAt: now, state: "review", createdAt: now, updatedAt: now }),
        ...items.map((item) => db.insert(academiaMigrationItems).values({ id: crypto.randomUUID(), migrationId, sourceUrl: item.sourceUrl, title: item.title, abstract: item.abstract, type: item.type, topicSlugs: JSON.stringify(item.topicSlugs), visibility: "private", selected: true, status: "pending", createdAt: now, updatedAt: now })),
      ]);
      return Response.json({ migration: { id: migrationId, itemCount: items.length, sourceProfileUrl, state: "review" }, nextStep: "Review every item. All imported work remains private unless you explicitly select public visibility during the final import." }, { status: 201 });
    }

    if (typeof input.migrationId !== "string") return Response.json({ error: "migrationId is required" }, { status: 400 });
    const [migration] = await db.select().from(academiaMigrations).where(and(eq(academiaMigrations.id, input.migrationId), eq(academiaMigrations.userId, account.user.id))).limit(1);
    if (!migration) return Response.json({ error: "Migration draft was not found" }, { status: 404 });
    if (!Array.isArray(input.selections) || input.selections.length < 1 || input.selections.length > 50) return Response.json({ error: "Select at least one migration item" }, { status: 400 });
    const pendingItems = await db.select().from(academiaMigrationItems).where(and(eq(academiaMigrationItems.migrationId, migration.id), eq(academiaMigrationItems.status, "pending")));
    const selectionById = new Map(input.selections.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object").map((entry) => [entry.itemId, entry]));
    const selectedItems = pendingItems.filter((item) => selectionById.get(item.id)?.selected === true);
    if (!selectedItems.length) return Response.json({ error: "Select at least one pending item to import" }, { status: 400 });
    const audience = await accountAudience(db, account.user.id);
    await db.insert(publicProfiles).values({ publicId: crypto.randomUUID(), userId: account.user.id }).onConflictDoNothing();
    const now = new Date().toISOString();
    const imported: Array<{ id: string; status: string; title: string; visibility: string }> = [];
    for (const item of selectedItems) {
      const choice = selectionById.get(item.id)!;
      const requestedVisibility = privateOrPublic(choice.visibility);
      const safety = publicationSafetyDecision({ abstract: item.abstract, title: item.title });
      const visibility = safety.action === "quarantine" || requestedVisibility !== "public" || !audience.capabilities.canPublishPublicly ? "private" : "public";
      const status = safety.action === "quarantine" ? "quarantined" : "processing";
      const publicationId = crypto.randomUUID();
      const receipt = await createProvenanceReceipt({ authorId: account.user.id, publicationId, title: item.title, abstract: item.abstract, type: item.type, version: 1 });
      await db.batch([
        db.insert(publications).values({ id: publicationId, authorId: account.user.id, type: item.type, title: item.title, abstract: item.abstract, visibility, verificationStatus: status, createdAt: now, publishedAt: now }),
        db.insert(publicationVersions).values({ id: crypto.randomUUID(), publicationId, version: 1, title: item.title, abstract: item.abstract, contentHash: receipt.contentHash, provenanceReceipt: JSON.stringify(receipt), createdAt: now }),
        db.insert(publicationRelationships).values({ id: crypto.randomUUID(), userId: account.user.id, publicationId, relationType: "imports_record_from", sourceUrl: item.sourceUrl, sourceTitle: item.title, sourceLicense: null, declaration: "Imported by the account owner from an Academia.edu record; the source platform record remains authoritative for its own publication history.", createdAt: now }),
        db.update(academiaMigrationItems).set({ importedPublicationId: publicationId, selected: true, visibility, status: "imported", updatedAt: now }).where(eq(academiaMigrationItems.id, item.id)),
        ...(safety.action === "quarantine" && safety.reasonCode ? [db.insert(moderationCases).values({ id: crypto.randomUUID(), publicationId, source: "publication_secret_scan", reasonCode: safety.reasonCode, status: "open", createdAt: now })] : []),
      ]);
      const topicSlugs = jsonTopics(item.topicSlugs);
      if (topicSlugs.length) {
        await db.batch(topicSlugs.map((slug) => db.insert(topics).values({ id: crypto.randomUUID(), slug, label: topicLabel(slug) }).onConflictDoNothing()));
        const topicRows = await db.select({ id: topics.id }).from(topics).where(inArray(topics.slug, topicSlugs));
        if (topicRows.length) await db.batch(topicRows.map((topic) => db.insert(publicationTopics).values({ id: crypto.randomUUID(), publicationId, topicId: topic.id }))); 
      }
      imported.push({ id: publicationId, status, title: item.title, visibility });
    }
    await db.update(academiaMigrations).set({ state: "imported", updatedAt: now }).where(eq(academiaMigrations.id, migration.id));
    return Response.json({ imported, migrationId: migration.id, notice: "Imported work is private unless you explicitly selected public visibility. Each publication has a new Scholarium provenance receipt; this does not replace the source platform's record or legal copyright registration." }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to prepare Academia migration";
    return Response.json({ error: message }, { status: /required|must|between|Select|Confirm/.test(message) ? 400 : 500 });
  }
}
