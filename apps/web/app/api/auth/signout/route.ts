import { safeRelativeReturnPath } from "../../../../app/chatgpt-auth";
import { clearProviderSessionCookie } from "../../../../lib/google-oauth";
export async function GET(request: Request) { const returnTo = safeRelativeReturnPath(new URL(request.url).searchParams.get("return_to") ?? "/"); const response = Response.redirect(new URL(returnTo, request.url), 302); response.headers.append("Set-Cookie", clearProviderSessionCookie()); return response; }
