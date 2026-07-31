import { getDb } from "../../../../../db";
import { getPlatformIdentity, signInRequired } from "../../../../../lib/platform-identity";
import { assertSchoolSafetyCasesEnabled } from "../../../../../lib/teach-safety-datadog";
import { reconcileSchoolSafetyOutbox, schoolSafetyErrorResponse } from "../../../../../lib/teach-safety-case-service";

export async function POST(request: Request) {
  try {
    await assertSchoolSafetyCasesEnabled();
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    return Response.json(await reconcileSchoolSafetyOutbox(
      await getDb(),
      identity.userId,
      await request.json() as Record<string, unknown>,
    ), { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return schoolSafetyErrorResponse(error);
  }
}
