# Payment provider adapter seed

Use this seed only after the provider account, terms, supported assets, regions, fees, refund policy, and webhook signature method are verified.

## Invariants

- Server creates and captures orders; browsers receive no provider secret.
- Webhooks are signature-verified and idempotent.
- Store only provider order/capture IDs, amount, currency, status and timestamps.
- Never store card numbers, wallet private keys, recovery phrases, or raw webhook bodies.
- Payment status never influences feed ranking, moderation, publication rights, or essential access.
- A provider-controlled asset list must be displayed with its timestamp; never hard-code a “top N coins” claim.

## Adapter surface

```ts
export interface PaymentAdapter {
  createCheckout(input: { amountCents: number; currency: string; receiptId: string }): Promise<{ checkoutUrl: string; providerOrderId: string }>;
  capture(input: { providerOrderId: string }): Promise<{ providerCaptureId: string; status: "completed" }>;
  verifyWebhook(input: { headers: Headers; body: string }): Promise<{ eventId: string; orderId: string; status: "completed" | "pending" | "denied" } | null>;
}
```

Start in a sandbox, write deterministic tests for invalid signatures and duplicate events, then register the production webhook only after a human confirms the provider configuration.
