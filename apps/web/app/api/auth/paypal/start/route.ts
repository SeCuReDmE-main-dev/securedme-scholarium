import { paypalStartResponse } from "../../../../../lib/paypal-oauth";
export async function GET(request: Request) { return paypalStartResponse(request); }
