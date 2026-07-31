import { getDb } from "../../../../db";
import { getPlatformIdentity, signInRequired } from "../../../../lib/platform-identity";
import { assertSchoolSafetyCasesEnabled } from "../../../../lib/teach-safety-datadog";
import {
  createSchoolSafetyCase,
  listSchoolSafetyCases,
  schoolSafetyErrorResponse,
} from "../../../../lib/teach-safety-case-service";

export async function GET() {
  try {
    await assertSchoolSafetyCasesEnabled();
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    return Response.json(await listSchoolSafetyCases(await getDb(), identity.userId), {
      headers: { "cache-control": "private, no-store" },
    });
  } catch (error) {
    return schoolSafetyErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await assertSchoolSafetyCasesEnabled();
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const result = await createSchoolSafetyCase(
      await getDb(),
      identity.userId,
      await request.json() as Record<string, unknown>,
    );
    return Response.json(result, {
      status: result.replayed ? 200 : 201,
      headers: { "cache-control": "private, no-store" },
    });
  } catch (error) {
    return schoolSafetyErrorResponse(error);
  }
}
