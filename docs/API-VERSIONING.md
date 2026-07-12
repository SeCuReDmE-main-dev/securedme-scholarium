# Scholarium API versioning

## Canonical resource surface

All public data and product APIs use the `/api/v1` prefix. The web client calls that versioned surface, and the OpenAPI contract advertises it as canonical.

The public schema entrypoint is `/api/v1/openapi.json`. In the current Vinext layout the Worker rewrites that canonical path to the implementation route under `/api/openapi.json`, so deployed clients should still treat the versioned path as authoritative.

## Compatibility period

Existing unversioned resource paths under `/api/*` remain temporarily available for deployed pre-alpha clients. They return `Deprecation: true` and a `Link` header identifying the matching `/api/v1` successor. New client code must not use them.

## OAuth exception

`/api/auth/*` remains an unversioned identity handoff boundary while PayPal and other providers hold those callback URLs in their provider consoles. It is excluded from the resource API compatibility rule and is protected with `Cache-Control: no-store`.

Provider-independent product routes such as `/api/v1/verified-subscription`, `/api/v1/payments/paypal/order`, `/api/v1/payments/paypal/return`, and the signed webhook handlers remain part of the canonical versioned resource contract even when they end in redirects or provider callbacks.

## Change rule

A breaking resource change requires a new `/api/vN` surface, OpenAPI update, migration note, compatibility window, and contract test. A breaking OAuth callback change requires a provider-console update and a separate login-path validation.
