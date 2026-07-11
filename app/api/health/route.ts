export function GET() {
  return Response.json({
    service: "scholarium",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
