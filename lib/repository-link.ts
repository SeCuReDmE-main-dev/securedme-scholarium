export type RepositoryLink = { canonicalUrl: string; provider: "github" | "gitlab" | "sourceforge"; repositoryPath: string };

/**
 * Accept only a repository homepage, never credential-bearing clone URLs,
 * issue trackers, webhooks, or arbitrary provider pages.
 */
export function canonicalRepositoryLink(value: unknown): RepositoryLink | null {
  if (typeof value !== "string" || value.length > 2_048) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return null;
    const host = url.hostname.toLowerCase().replace(/^www\./u, "");
    const segments = url.pathname.split("/").filter(Boolean).map((segment) => decodeURIComponent(segment));
    if (host === "github.com" && segments.length === 2) {
      const repositoryPath = `${segments[0]}/${segments[1].replace(/\.git$/u, "")}`;
      return safePath(repositoryPath) ? { canonicalUrl: `https://github.com/${repositoryPath}`, provider: "github", repositoryPath } : null;
    }
    if (host === "gitlab.com" && segments.length >= 2 && !segments.includes("-")) {
      const repositoryPath = segments.join("/").replace(/\.git$/u, "");
      return safePath(repositoryPath) ? { canonicalUrl: `https://gitlab.com/${repositoryPath}`, provider: "gitlab", repositoryPath } : null;
    }
    if (host === "sourceforge.net" && segments.length >= 3 && segments[0] === "p" && segments[2] === "code") {
      const repositoryPath = segments.slice(0, 3).join("/");
      return safePath(repositoryPath) ? { canonicalUrl: `https://sourceforge.net/${repositoryPath}`, provider: "sourceforge", repositoryPath } : null;
    }
  } catch { return null; }
  return null;
}

function safePath(path: string) {
  return path.length <= 300 && /^[A-Za-z0-9._/-]+$/u.test(path) && !path.includes("..");
}
