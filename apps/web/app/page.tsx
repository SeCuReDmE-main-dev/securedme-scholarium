import type { Metadata } from "next";
import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "./chatgpt-auth";
import { ScholariumClient } from "./scholarium-client";

export const metadata: Metadata = {
  title: "Scholarium — Open knowledge, real momentum",
  description:
    "A free scientific and educational social platform for publications, projects, video, and community support.",
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  return <ScholariumClient session={{
    displayName: user?.displayName ?? null,
    signInPath: chatGPTSignInPath("/"),
    signOutPath: chatGPTSignOutPath("/"),
  }} />;
}
