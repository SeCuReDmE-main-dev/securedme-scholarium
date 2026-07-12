import { localInsightContract } from "../../../lib/local-insights";

export function GET() {
  return Response.json({ localInsights: localInsightContract });
}
