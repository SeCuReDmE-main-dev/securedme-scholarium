# Payments: verified contribution and provider boundary

Scholarium's payment path is separate from its feed and publication rights: a payment never changes ranking, discovery, moderation, verification, or access to essential functions.

## PayPal sandbox flow

1. A verified contributor starts a server-created Orders v2 `CAPTURE` order for the fixed **USD 0.99** contribution.
2. The browser receives only PayPal's approval URL; client and secret never enter browser code.
3. `GET /api/v1/payments/paypal/return` captures the approved order server-side and stores only the provider order/capture IDs, amount, currency, status and timestamps before redirecting back to the app.
4. The PayPal webhook independently verifies its signature through PayPal's verification API, then reconciles the same minimal receipt.

## Verified contributor plan boundary

`GET /api/v1/verified-subscription` exposes only the fixed plan metadata: the verified-contributor identifier, the monthly **USD 0.99** amount, the display label, and an explicit `rankingEffect: "none"` contract.

`POST /api/v1/verified-subscription` is account-bound. It does not charge, subscribe, or change ranking by itself. It only prepares the local subscription state after the signed-in person has both a verified passkey and the required document-verification status. Payment setup remains a separate PayPal order flow.

Production checkout is fail-closed and requires a dedicated live REST app: `PAYPAL_CHECKOUT_CLIENT_ID`, `PAYPAL_CHECKOUT_CLIENT_SECRET`, `PAYPAL_CHECKOUT_MODE=live`, and `PAYPAL_CHECKOUT_WEBHOOK_ID`. Login credentials are never reused for checkout. No client secret, wallet key, card data, or raw webhook body is stored. QuaNTecH-ViD is an independent product and does not use this Scholarium payment boundary.

Register the deployed endpoint `/api/v1/webhooks/paypal` for `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.PENDING`, and `PAYMENT.CAPTURE.DENIED`. Do not activate a real recurring billing claim until a PayPal subscription product, billing webhook and cancellation workflow are separately implemented and verified.

## Crypto payments

Crypto is deliberately provider-neutral and **not connected**. There is no honest universal “top 25” asset promise: availability, supported networks, fees, permitted regions, settlement, and compliance depend on the contracted provider and change regularly. Coinbase Business Checkout, for example, requires a Business account and charges fees; its Payment Acceptance product is partner/onboarding controlled. Scholarium will expose only the provider-confirmed asset list after an authorized provider connection, and will never store a wallet private key.

## Sources

- [PayPal checkout and Orders v2](https://developer.paypal.com/docs/checkout)
- [PayPal webhook integration and signature verification](https://developer.paypal.com/api/rest/webhooks/rest/)
- [Coinbase Business Checkout APIs](https://docs.cdp.coinbase.com/coinbase-business/checkout-apis/overview)
