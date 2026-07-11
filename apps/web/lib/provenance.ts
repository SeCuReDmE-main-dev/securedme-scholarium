export type ProvenanceReceipt = {
  algorithm: "SHA-256";
  contentHash: string;
  issuedAt: string;
  receiptId: string;
  version: 1;
};

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createProvenanceReceipt(input: {
  authorId: string;
  publicationId: string;
  title: string;
  abstract: string;
  type: string;
}): Promise<ProvenanceReceipt> {
  const canonical = JSON.stringify({
    abstract: input.abstract,
    authorId: input.authorId,
    publicationId: input.publicationId,
    title: input.title,
    type: input.type,
  });
  const contentHash = toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical)));

  return {
    algorithm: "SHA-256",
    contentHash,
    issuedAt: new Date().toISOString(),
    receiptId: crypto.randomUUID(),
    version: 1,
  };
}
