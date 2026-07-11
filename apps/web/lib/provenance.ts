export type ProvenanceReceipt = {
  algorithm: "SHA-256";
  contentHash: string;
  issuedAt: string;
  receiptId: string;
  version: number;
};

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export type ProvenanceInput = {
  authorId: string;
  publicationId: string;
  title: string;
  abstract: string;
  type: string;
  version: number;
};

export async function provenanceContentHash(input: ProvenanceInput) {
  const canonical = JSON.stringify({
    abstract: input.abstract,
    authorId: input.authorId,
    publicationId: input.publicationId,
    title: input.title,
    type: input.type,
    version: input.version,
  });
  return toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical)));
}

export async function createProvenanceReceipt(input: ProvenanceInput): Promise<ProvenanceReceipt> {
  const contentHash = await provenanceContentHash(input);

  return {
    algorithm: "SHA-256",
    contentHash,
    issuedAt: new Date().toISOString(),
    receiptId: crypto.randomUUID(),
    version: input.version,
  };
}
