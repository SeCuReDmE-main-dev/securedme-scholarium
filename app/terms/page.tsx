import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms — Scholarium" };

export default function TermsPage() {
  return <main className="legal-page"><article className="legal-card"><Link href="/">← Scholarium</Link><p className="landing-kicker">SECUREDME EDUCATION / PRE-ALPHA</p><h1>Terms for a learning commons.</h1><p>Scholarium is pre-alpha educational software. It supports publishing, attribution, discussion, and learning; it does not replace professional, legal, academic, or copyright review.</p><h2>Respect the work and the people</h2><ul><li>Share work you have the right to publish and attribute collaborators accurately.</li><li>Keep discussion constructive, relevant, and safe for learners.</li><li>Do not use the platform to harass, impersonate, or misrepresent research results.</li></ul><h2>Discovery stays free</h2><p>Contributions may support the project, but they never buy reach, ranking, publication rights, or special treatment in the feed.</p><h2>Provider sign-in</h2><p>When you choose ChatGPT, Google, GitHub, or PayPal, the provider’s own terms and consent screen also apply. Scholarium keeps provider identities separate unless an explicit account-linking flow is introduced later.</p><h2>Changes</h2><p>As a pre-alpha platform, features and terms may evolve. Material changes will be communicated through the project’s public source and release notes.</p></article></main>;
}
