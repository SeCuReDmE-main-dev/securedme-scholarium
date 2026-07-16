import { getPlatformIdentity, signInRequired } from "../../../../../lib/platform-identity";
import { routeLifeScienceResearch } from "../../../../../lib/teach-life-science-router";

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const route = routeLifeScienceResearch(await request.json() as Record<string, unknown>);
    return Response.json({ route }, { status: 200, headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "A valid educational research question is required." }, { status: 400 });
  }
}
