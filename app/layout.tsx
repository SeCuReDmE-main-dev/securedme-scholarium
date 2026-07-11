import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({ variable: "--font-display", weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Scholarium — Open knowledge, real momentum",
  description: "A free scientific and educational social platform for publications, projects, video, and community support.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geist.variable} ${instrumentSerif.variable}`}>{children}</body></html>;
}
