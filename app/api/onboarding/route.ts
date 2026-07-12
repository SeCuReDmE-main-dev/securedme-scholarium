import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { publicProfiles, rankingPreferences, readerPreferences, roleAssignments, users } from "../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";
import { readerPreferenceInsert } from "../../../lib/reader-preferences";

const supportedRoles = new Set(["student", "teacher", "professional", "amateur", "reader", "supporter"]);
const supportedAgeBands = new Set(["adult", "minor", "unknown"]);

type OnboardingInput = { ageBand?: unknown; displayName?: unknown; primaryRole?: unknown };

function requiredString(value: unknown, field: string, maximum: number) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`);
  const normalized = value.trim();
  if (normalized.length > maximum) throw new Error(`${field} must be at most ${maximum} characters`);
  return normalized;
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as OnboardingInput;
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const userId = identity.userId;
    const email = identity.email;
    const displayName = typeof input.displayName === "string" && input.displayName.trim() ? requiredString(input.displayName, "displayName", 120) : identity.displayName;
    const primaryRole = requiredString(input.primaryRole, "primaryRole", 32);
    const ageBand = requiredString(input.ageBand, "ageBand", 16);
    if (!supportedRoles.has(primaryRole) || !supportedAgeBands.has(ageBand)) {
      return Response.json({ error: "Unsupported role or age band" }, { status: 400 });
    }

    const db = await getDb();
    const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
    if (existingUser) return Response.json({ error: "Account already exists" }, { status: 409 });

    await db.batch([
      db.insert(users).values({ displayName, email, id: userId, primaryRole }),
      db.insert(publicProfiles).values({ publicId: crypto.randomUUID(), userId }),
      db.insert(roleAssignments).values({ ageBand, id: crypto.randomUUID(), role: primaryRole, userId }),
      db.insert(rankingPreferences).values({ userId }),
      db.insert(readerPreferences).values(readerPreferenceInsert(userId)),
    ]);

    return Response.json({
      account: { ageBand, displayName, id: userId, primaryRole },
      safeguards: ageBand === "minor" ? ["private_profile_default", "no_direct_creator_payouts", "supervised_adult_messaging"] : [],
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create account";
    return Response.json({ error: message }, { status: /required|at most/.test(message) ? 400 : 500 });
  }
}
