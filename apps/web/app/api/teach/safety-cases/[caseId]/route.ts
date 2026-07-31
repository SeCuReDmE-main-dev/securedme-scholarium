import { getDb } from "../../../../../db";
import { getPlatformIdentity, signInRequired } from "../../../../../lib/platform-identity";
import { assertSchoolSafetyCasesEnabled } from "../../../../../lib/teach-safety-datadog";
import { getSchoolSafetyCase, schoolSafetyErrorResponse } from "../../../../../lib/teach-safety-case-service";

export async function GET(_request: Request, context: { params: Promise<{ caseId: string }> }) {
  try {
    await assertSchoolSafetyCasesEnabled();
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const { caseId } = await context.params;
    return Response.json(await getSchoolSafetyCase(await getDb(), identity.userId, caseId), {
      headers: { "cache-control": "private, no-store" },
    });
  } catch (error) {
    return schoolSafetyErrorResponse(error);
  }
}
