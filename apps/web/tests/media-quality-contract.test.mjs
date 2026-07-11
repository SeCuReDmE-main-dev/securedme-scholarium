import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("media production exposes a free high-quality contract and an opt-in local VideoPrism adapter", async () => {
  const quality = await readFile(new URL("../lib/video-quality.ts", import.meta.url), "utf8");
  const plan = await readFile(new URL("../lib/media-production-plan.ts", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/video-production-plan/route.ts", import.meta.url), "utf8");
  const client = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  assert.match(quality, /1920, height: 1080/);
  assert.match(quality, /videoBitrate: "5000k"/);
  assert.match(quality, /videoprism_lvt_public_v1_base/);
  assert.match(quality, /outputBoundary/);
  assert.match(plan, /createVideoQualityContract/);
  assert.match(route, /reviewMode must be none or local_videoprism/);
  assert.match(client, /VideoPrism — semantic scene review/);
  assert.match(client, /adapter is prepared but not connected/);
});
