import { getDb } from "../../../../../../db";
import { getPlatformIdentity, signInRequired } from "../../../../../../lib/platform-identity";
import { assertSchoolSafetyCasesEnabled } from "../../../../../../lib/teach-safety-datadog";
import { appealSchoolSafetyCase, schoolSafetyErrorResponse } from "../../../../../../lib/teach-safety-case-service";

export async function POST(request: Request, context: { params: Promise<{ caseId: string }> }) {
  try {
    await assertSchoolSafetyCasesEnabled();
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const { caseId } = await context.params;
    const input = await request.json() as Record<string, unknown>;
    return Response.json(await appealSchoolSafetyCase(await getDb(), identity.userId, { ...input, caseId }), {
      status: 201,
      headers: { "cache-control": "private, no-store" },
    });
  } catch (error) {
    return schoolSafetyErrorResponse(error);
  }
}
