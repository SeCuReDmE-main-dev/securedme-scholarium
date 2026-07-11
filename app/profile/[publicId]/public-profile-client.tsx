"use client";

import Link from "next/link";
import { CSSProperties, useEffect, useState } from "react";

type PublicProfile = {
  accentColor: string;
  badge: { label?: string; visible: boolean };
  colorScheme: string;
  displayName: string;
  hasAvatar: boolean;
  hasBanner: boolean;
  primaryRole: string;
  publicId: string;
};
type PublicWork = { abstract: string; createdAt: string; id: string; status: string; title: string; type: string };

export function PublicProfileClient({ publicId }: { publicId: string }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [work, setWork] = useState<PublicWork[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/v1/public-profiles/${encodeURIComponent(publicId)}`)
      .then(async (response) => ({ ok: response.ok, payload: await response.json() as { error?: string; profile?: PublicProfile; publications?: PublicWork[] } }))
      .then(({ ok, payload }) => {
        if (!active) return;
        if (!ok || !payload.profile) { setError(payload.error ?? "This public profile is unavailable."); return; }
        setProfile(payload.profile);
        setWork(payload.publications ?? []);
      })
      .catch(() => { if (active) setError("This public profile could not be loaded."); });
    return () => { active = false; };
  }, [publicId]);

  if (error) return <main className="public-profile-page"><section className="public-profile-empty"><Link href="/">← Back to Scholarium</Link><h1>Profile unavailable</h1><p>{error}</p></section></main>;
  if (!profile) return <main className="public-profile-page"><section className="public-profile-empty"><Link href="/">← Back to Scholarium</Link><p>Loading public profile…</p></section></main>;

  const media = (kind: "avatar" | "banner") => `/api/v1/profile-media?publicProfileId=${encodeURIComponent(profile.publicId)}&kind=${kind}`;
  const bannerStyle = profile.hasBanner ? { backgroundImage: `url(${media("banner")})` } satisfies CSSProperties : undefined;
  return <main className="public-profile-page" style={{ "--profile-accent": profile.accentColor } as CSSProperties}>
    <section className="public-profile-shell">
      <Link className="public-profile-back" href="/">← Back to Scholarium</Link>
      <header className="public-profile-hero">
        <div className="public-profile-banner" style={bannerStyle} />
        <div className="public-profile-identity">
          {profile.hasAvatar ? <span aria-label={`${profile.displayName} profile`} className="public-profile-avatar" role="img" style={{ backgroundImage: `url(${media("avatar")})` }} /> : <span className="public-profile-avatar initials">{profile.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span>}
          <div><p className="eyebrow">SCHOLARIUM PUBLIC PROFILE</p><h1>{profile.displayName}</h1><p>{profile.primaryRole.replaceAll("_", " ")}</p>{profile.badge.visible && <span className="public-profile-badge">✓ {profile.badge.label}</span>}</div>
        </div>
      </header>
      <section className="public-profile-work" aria-label={`${profile.displayName} public work`}>
        <div><p className="eyebrow">PUBLIC WORK</p><h2>Traceable work shared with the learning commons.</h2></div>
        {work.length === 0 ? <p className="public-profile-empty-work">No public work has been published yet.</p> : <div className="public-profile-work-grid">{work.map((publication) => <article key={publication.id}><div><span>{publication.type.replaceAll("_", " ").toUpperCase()}</span><span className={publication.status === "verified" ? "status verified" : "status processing"}>{publication.status === "verified" ? "✓ VERIFIED" : "◌ PROCESSING"}</span></div><h3>{publication.title}</h3><p>{publication.abstract}</p><time dateTime={publication.createdAt}>Published {new Date(publication.createdAt).toLocaleDateString()}</time></article>)}</div>}
      </section>
      <p className="public-profile-boundary">This page contains only information its owner chose to make public. It does not reveal provider identities, email, private settings, or private media.</p>
    </section>
  </main>;
}
