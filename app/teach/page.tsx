import type { Metadata } from "next";
import { getPlatformIdentity } from "../../lib/platform-identity";
import { TeachClient } from "./teach-client";
import "./teach.css";
import "./teach-evidence.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Scholarium Teach",
  description: "Adaptive, multimodal learning built from evidence of mastery and learner-controlled strengths.",
};

export default async function TeachPage() {
  const identity = await getPlatformIdentity();
  return <TeachClient authenticated={Boolean(identity)} />;
}
