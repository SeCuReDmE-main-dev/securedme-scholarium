# API map
- `/api/v1` is the canonical resource API; unversioned routes are compatibility aliases.
- `/teach` owns the Scholarium Teach learner surface.
- Education tool links are discovery boundaries and do not proxy authentication or canonical product state.
- `/api/v1/webmcp/manifest` serves the machine-readable twelve-descriptor contract used by the `/app` WebMCP bridge; its checked-in source is `apps/web/public/webmcp/securedme-scholarium.manifest.json`.
- WebMCP HTTP handlers reuse existing `/api/v1` routes; the unavailable publication EXECUTE wrapper does not bypass authentication or add an unversioned write API.
