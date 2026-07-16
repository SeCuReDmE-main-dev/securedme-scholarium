import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({ variable: "--font-display", weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Scholarium — Turn knowledge into traceable evidence",
  description: "A free scientific and educational platform for publishing work with context, attribution, provenance, and a durable knowledge trail.",
  metadataBase: new URL("https://www.scholarium.securedme.ca"),
  openGraph: {
    title: "Scholarium — Turn knowledge into traceable evidence",
    description: "Open science, open education, provenance, and no paid ranking.",
    images: [{ url: "/brand/campaigns/landing-hero-dark.webp", width: 1672, height: 941, alt: "Scholarium dark hero banner from the canonical asset vault." }],
  },
  twitter: { card: "summary_large_image", title: "Scholarium — Turn knowledge into traceable evidence.", images: ["/brand/campaigns/landing-hero-dark.webp"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><head><link rel="icon" href="/favicon.svg" type="image/svg+xml" /></head><body className={`${geist.variable} ${instrumentSerif.variable}`}>{children}</body></html>;
}
