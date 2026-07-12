import { notificationPreferenceContract, type NotificationPreferenceInput } from "../../../lib/reader-preferences";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  return Response.json({ preference: notificationPreferenceContract() }, { headers: { "cache-control": "private, no-store" } });
}

export async function PUT(request: Request) {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const input = (await request.json()) as NotificationPreferenceInput;
  return Response.json({ preference: notificationPreferenceContract(input) }, { headers: { "cache-control": "private, no-store" } });
}
