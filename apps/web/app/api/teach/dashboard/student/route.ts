import { getDb } from "../../../../../db";
import { getPlatformIdentity, signInRequired } from "../../../../../lib/platform-identity";
import { studentSocialDashboard } from "../../../../../lib/teach-social-service";

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  return Response.json(await studentSocialDashboard(await getDb(), identity.userId), { headers: { "cache-control": "private, no-store" } });
}
