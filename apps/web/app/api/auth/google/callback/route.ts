import { googleCallbackResponse } from "../../../../../lib/google-oauth";

export async function GET(request: Request) {
  return googleCallbackResponse(request);
}
