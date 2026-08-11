# Scholarium web application

This is the deployable React/Vinext application for [SecuredMe Scholarium](../../README.md).

## Commands

```powershell
npm install
npm run dev
npm test
npm run db:generate
```

The application targets Cloudflare Workers. `DB` (D1) and `MEDIA` (R2) are logical deployment bindings defined in [`.openai/hosting.json`](.openai/hosting.json). Do not add secrets to this repository or request raw provider tokens from users.

The main navigation includes an Education toolchain view that presents Teach, AlgoQuest, Algorithm Builder, FfeD-QLC, and the Gateway boundary. It is a discovery and contract surface only: it does not merge product state, bypass product authentication, or turn the shared adapter policy into a live-login claim.

The root README is the product and governance source of truth. This file stays intentionally technical and short.
