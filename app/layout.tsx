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
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Scholarium — Turn knowledge into traceable evidence." }],
  },
  twitter: { card: "summary_large_image", title: "Scholarium — Turn knowledge into traceable evidence.", images: ["/og.png"] },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geist.variable} ${instrumentSerif.variable}`}>{children}</body></html>;
}
