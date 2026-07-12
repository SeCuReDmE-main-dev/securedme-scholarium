import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy — Scholarium" };

export default function PrivacyPage() {
  return <main className="legal-page"><article className="legal-card"><Link href="/">← Scholarium</Link><p className="landing-kicker">SECUREDME EDUCATION / PRE-ALPHA</p><h1>Privacy, with boundaries.</h1><p>Scholarium is built to help people share and learn from serious work without turning identity or attention into a product.</p><h2>What we collect</h2><p>Account actions use the basic identity returned by the provider you choose: display name, verified email, provider name, and provider-specific subject identifier. We do not store provider access tokens as Scholarium profile data.</p><h2>What stays local</h2><p>Optional personal activity insights remain on your device. Profile image and banner previews remain local until a future account save flow explicitly supports them.</p><h2>What we do not collect</h2><p>Scholarium does not store government ID images, fingerprint data, payment credentials, or a paid-reach profile. Verification and payment providers keep those records in their own systems.</p><h2>Contact</h2><p>For privacy questions about this pre-alpha service, contact the SecuredMe team through the public project repository.</p></article></main>;
}
