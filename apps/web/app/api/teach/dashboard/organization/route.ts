import { getDb } from "../../../../../db";
import { getPlatformIdentity, signInRequired } from "../../../../../lib/platform-identity";
import { organizationSocialDashboard } from "../../../../../lib/teach-social-service";

export async function GET() {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    return Response.json(await organizationSocialDashboard(await getDb(), identity.userId), { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Organization dashboard access denied." }, { status: 403 }); }
}
