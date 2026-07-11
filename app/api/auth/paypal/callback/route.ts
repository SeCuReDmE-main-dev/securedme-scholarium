import { paypalCallbackResponse } from "../../../../../lib/paypal-oauth";
export async function GET(request: Request) { return paypalCallbackResponse(request); }
