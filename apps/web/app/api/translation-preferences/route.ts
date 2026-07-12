import { translationPreferenceContract, type TranslationPreferenceInput } from "../../../lib/reader-preferences";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  return Response.json({ preference: translationPreferenceContract() }, { headers: { "cache-control": "private, no-store" } });
}

export async function PUT(request: Request) {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const input = (await request.json()) as TranslationPreferenceInput;
  return Response.json({ preference: translationPreferenceContract(input) }, { headers: { "cache-control": "private, no-store" } });
}
