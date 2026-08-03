# SecuredMe Settings Operator contract

Schema: `scholarium.teach.settings.v1.json`. This schema is the single source
of configuration names. The Settings Operator renders values; source control
contains neither values nor a runnable alpha environment.

These names are registered through SecuredMe Settings Operator. Values never belong in source control.

- `SCHOLARIUM_TEACH_ENGINE_URL`: private HTTPS origin used by Scholarium.
- `SCHOLARIUM_TEACH_ENGINE_HMAC_SECRET`: request-envelope signing secret.
- `SCHOLARIUM_TEACH_POSTGRES_ADMIN_PASSWORD`: private catalog administrator.
- `SCHOLARIUM_TEACH_POSTGRES_READER_PASSWORD`: engine read-only catalog user.
- `SCHOLARIUM_TEACH_POSTGRES_DSN`: read-only runtime catalog connection.
- `SCHOLARIUM_TEACH_TIMESCALE_DSN`: optional write-only telemetry connection.
- `SCHOLARIUM_CODEPROJECT_URL`: optional CodeProject.AI observer origin.
- `SCHOLARIUM_CODEPROJECT_ENABLED`: defaults to `false`.
- `SCHOLARIUM_TEACH_AUDIO_MODE`: `disabled`, `synthetic`, or `consenting_adult`.
- `SCHOLARIUM_TEACH_CLOUDFLARE_TUNNEL_TOKEN`: optional outbound-only tunnel token.
- `SCHOLARIUM_TEACH_CLOUDFLARED_IMAGE_DIGEST`: reviewed cloudflared image digest.
- `SCHOLARIUM_CODEPROJECT_IMAGE_DIGEST`: reviewed CodeProject.AI image digest.
- `SCHOLARIUM_TEACH_ENGINE_ACCESS_CLIENT_ID`: optional Cloudflare Access client id.
- `SCHOLARIUM_TEACH_ENGINE_ACCESS_CLIENT_SECRET`: optional Cloudflare Access secret.
- `SCHOLARIUM_OBJECT_STORE_IMAGE_DIGEST`: optional reviewed object-store image digest.
- `SCHOLARIUM_OBJECT_STORE_ACCESS_KEY`: optional object-store access key.
- `SCHOLARIUM_OBJECT_STORE_SECRET_KEY`: optional object-store secret.

The service must fail closed for decisions when its HMAC or pack is missing. Timescale and CodeProject failures must never block textual learning or mutate D1.

`compose.alpha.yml` is the only runnable alpha base. Tunnel and observer
services are separate overlays, remain disabled by default, publish no host
port, and require image digests from Settings Operator.
