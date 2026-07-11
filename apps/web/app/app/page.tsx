import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "../chatgpt-auth";
import { ScholariumClient } from "../scholarium-client";

export const dynamic = "force-dynamic";

export default async function ScholariumApp() {
  const user = await getChatGPTUser();
  return <ScholariumClient session={{
    displayName: user?.displayName ?? null,
    signInPath: chatGPTSignInPath("/app"),
    signOutPath: chatGPTSignOutPath("/app"),
  }} />;
}
