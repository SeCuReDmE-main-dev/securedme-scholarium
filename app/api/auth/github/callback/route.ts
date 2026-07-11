import { githubCallbackResponse } from "../../../../../lib/github-oauth";
export async function GET(request: Request) { return githubCallbackResponse(request); }
