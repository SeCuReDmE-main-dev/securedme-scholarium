import { createFormalizationPreview, quanthorTemplates } from "../../../lib/quanthor-formalization";

type FormalizationInput = { kind?: unknown; text?: unknown; title?: unknown };

export function GET() {
  return Response.json({ templates: quanthorTemplates });
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as FormalizationInput;
    if (input.kind !== undefined && typeof input.kind !== "string") {
      return Response.json({ error: "kind must be a supported template id" }, { status: 400 });
    }
    if (input.text !== undefined && typeof input.text !== "string") {
      return Response.json({ error: "text must be plain text" }, { status: 400 });
    }
    if (input.title !== undefined && typeof input.title !== "string") {
      return Response.json({ error: "title must be plain text" }, { status: 400 });
    }
    return Response.json({ formalization: createFormalizationPreview({ kind: input.kind, text: input.text, title: input.title }) });
  } catch {
    return Response.json({ error: "A valid JSON formalization request is required" }, { status: 400 });
  }
}
