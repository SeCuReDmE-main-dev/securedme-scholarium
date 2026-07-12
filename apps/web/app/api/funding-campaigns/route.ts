import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { contributionIntents, fundingCampaigns, publications, users } from "../../../db/schema";
import { accountAudience } from "../../../lib/account-audience";
import { fundingPolicy, normalizeCampaignPurpose, normalizeCampaignTitle, normalizeContributionCents, normalizeCurrency, normalizeDeadline, normalizeFundingProvider, normalizeGoalCents } from "../../../lib/funding-policy";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

async function currentAccount() {
  const identity = await getPlatformIdentity();
  if (!identity) return null;
  const db = await getDb();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
  return user ? { db, user } : null;
}

export async function GET() {
  const account = await currentAccount();
  if (!account) return signInRequired();
  const campaigns = await account.db.select().from(fundingCampaigns).where(eq(fundingCampaigns.userId, account.user.id)).orderBy(desc(fundingCampaigns.createdAt)).limit(20);
  return Response.json({ campaigns, policy: fundingPolicy }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  const account = await currentAccount();
  if (!account) return signInRequired();
  const input = await request.json() as { action?: unknown; amountCents?: unknown; anonymous?: unknown; campaignId?: unknown; currency?: unknown; deadlineAt?: unknown; goalCents?: unknown; provider?: unknown; publicationId?: unknown; publicProgress?: unknown; purpose?: unknown; title?: unknown };
  const audience = await accountAudience(account.db, account.user.id);
  if (audience.ageBand === "minor") return Response.json({ error: "Minor accounts cannot create campaigns or contribute without a reviewed supervised flow", policy: fundingPolicy }, { status: 403 });

  if (input.action === "contribute") {
    if (typeof input.campaignId !== "string") return Response.json({ error: "campaignId is required" }, { status: 400 });
    const [campaign] = await account.db.select().from(fundingCampaigns).where(eq(fundingCampaigns.id, input.campaignId)).limit(1);
    if (!campaign || campaign.status !== "provider_setup_required") return Response.json({ error: "Campaign is not ready for provider setup" }, { status: 404 });
    const amountCents = normalizeContributionCents(input.amountCents);
    if (!amountCents) return Response.json({ error: "amountCents must be between 100 and 250000" }, { status: 400 });
    const intent = {
      amountCents,
      anonymous: input.anonymous === true,
      campaignId: campaign.id,
      contributorId: account.user.id,
      createdAt: new Date().toISOString(),
      currency: normalizeCurrency(input.currency ?? campaign.currency),
      id: crypto.randomUUID(),
      provider: normalizeFundingProvider(input.provider),
      status: "provider_setup_required",
    };
    await account.db.insert(contributionIntents).values(intent);
    return Response.json({ intent, policy: fundingPolicy }, { status: 202, headers: { "cache-control": "private, no-store" } });
  }

  const title = normalizeCampaignTitle(input.title);
  const goalCents = normalizeGoalCents(input.goalCents);
  if (!title) return Response.json({ error: "title is required and must be at least 6 characters" }, { status: 400 });
  if (!goalCents) return Response.json({ error: "goalCents must be between 100 and 10000000" }, { status: 400 });

  let publicationId: string | null = null;
  if (typeof input.publicationId === "string" && input.publicationId.trim()) {
    const [publication] = await account.db.select({ id: publications.id }).from(publications).where(and(eq(publications.id, input.publicationId), eq(publications.authorId, account.user.id))).limit(1);
    if (!publication) return Response.json({ error: "Publication was not found or is not owned by this account" }, { status: 404 });
    publicationId = publication.id;
  }

  const now = new Date().toISOString();
  const campaign = {
    beneficiaryStatus: "verification_required",
    createdAt: now,
    currency: normalizeCurrency(input.currency),
    deadlineAt: normalizeDeadline(input.deadlineAt),
    goalCents,
    id: crypto.randomUUID(),
    publicProgress: input.publicProgress === true,
    publicationId,
    purpose: normalizeCampaignPurpose(input.purpose),
    status: "provider_setup_required",
    title,
    updatedAt: now,
    userId: account.user.id,
  };
  await account.db.insert(fundingCampaigns).values(campaign);
  return Response.json({ campaign, policy: fundingPolicy }, { status: 201, headers: { "cache-control": "private, no-store" } });
}
