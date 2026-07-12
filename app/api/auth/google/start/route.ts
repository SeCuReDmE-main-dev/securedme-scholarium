import { googleStartResponse } from "../../../../../lib/google-oauth";

export async function GET(request: Request) {
  return googleStartResponse(request);
}
