import type { Metadata } from "next";
import { and, eq, notInArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "../../../db";
import { publicationTopics, publications, topics, users } from "../../../db/schema";

const origin = "https://www.scholarium.securedme.ca";

async function publicPublication(publicationId: string) {
  if (!/^[0-9a-f-]{16,64}$/i.test(publicationId)) return null;
  const db = await getDb();
  const [publication] = await db.select({
    abstract: publications.abstract,
    author: users.displayName,
    createdAt: publications.createdAt,
    id: publications.id,
    publishedAt: publications.publishedAt,
    status: publications.verificationStatus,
    title: publications.title,
    type: publications.type,
  }).from(publications)
    .innerJoin(users, eq(users.id, publications.authorId))
    .where(and(eq(publications.id, publicationId), eq(publications.visibility, "public"), notInArray(publications.verificationStatus, ["quarantined", "removed"])))
    .limit(1);
  if (!publication) return null;
  const assignedTopics = await db.select({ label: topics.label }).from(publicationTopics).innerJoin(topics, eq(topics.id, publicationTopics.topicId)).where(eq(publicationTopics.publicationId, publication.id));
  return { ...publication, topics: assignedTopics.map((topic) => topic.label) };
}

export async function generateMetadata({ params }: { params: Promise<{ publicationId: string }> }): Promise<Metadata> {
  const { publicationId } = await params;
  const publication = await publicPublication(publicationId);
  if (!publication) return { title: "Publication unavailable — Scholarium", robots: { index: false, follow: false } };
  const canonical = `${origin}/publication/${encodeURIComponent(publication.id)}`;
  const publicationDate = (publication.publishedAt ?? publication.createdAt).slice(0, 10);
  return {
    title: `${publication.title} — Scholarium`,
    description: publication.abstract.slice(0, 280),
    alternates: { canonical },
    openGraph: { type: "article", title: publication.title, description: publication.abstract.slice(0, 280), url: canonical },
    other: {
      citation_abstract_html_url: canonical,
      citation_author: publication.author,
      citation_publication_date: publicationDate,
      citation_title: publication.title,
    },
  };
}

/**
 * A public, source-readable record. It contains only owner-enabled work and
 * emits standard citation metadata; no external indexing result is implied.
 */
export default async function PublicationPage({ params }: { params: Promise<{ publicationId: string }> }) {
  const { publicationId } = await params;
  const publication = await publicPublication(publicationId);
  if (!publication) notFound();
  const canonical = `${origin}/publication/${encodeURIComponent(publication.id)}`;
  const publicationDate = publication.publishedAt ?? publication.createdAt;
  return <main className="public-publication-page">
    <article className="public-publication-record">
      <p className="eyebrow">SCHOLARIUM PUBLICATION</p>
      <p>{publication.type.replaceAll("_", " ").toUpperCase()} · <span aria-label={`verification status: ${publication.status}`}>{publication.status === "verified" ? "✓ VERIFIED" : "◌ PUBLIC — VERIFICATION IN PROGRESS"}</span></p>
      <h1>{publication.title}</h1>
      <p>By {publication.author} · <time dateTime={publicationDate}>Published {new Date(publicationDate).toLocaleDateString()}</time></p>
      {publication.topics.length > 0 && <p aria-label="Topics">Topics: {publication.topics.join(" · ")}</p>}
      <section aria-labelledby="abstract-heading"><h2 id="abstract-heading">Abstract</h2><p>{publication.abstract}</p></section>
      <section aria-labelledby="record-heading"><h2 id="record-heading">Record and provenance</h2><p>This public page is an owner-enabled Scholarium record. It carries stable citation metadata, a canonical URL, and a verification label. It is not an external-indexing or scientific-validity claim.</p><p><a href={`/api/v1/scholar-indexing-status?publicationId=${encodeURIComponent(publication.id)}`}>View crawl prerequisite status</a></p></section>
    </article>
  </main>;
}
