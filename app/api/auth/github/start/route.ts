import { githubStartResponse } from "../../../../../lib/github-oauth";
export async function GET(request: Request) { return githubStartResponse(request); }
