import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({ variable: "--font-display", weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Scholarium — The public commons for serious work",
  description: "A free scientific and educational platform where work can be explained, attributed, discovered, and improved in public.",
  metadataBase: new URL("https://securedme-scholarium.jean-sebastien.chatgpt.site"),
  openGraph: {
    title: "Scholarium — The public commons for serious work",
    description: "Open science, open education, and no paid ranking.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Scholarium — Make knowledge move forward." }],
  },
  twitter: { card: "summary_large_image", title: "Scholarium — Make knowledge move forward.", images: ["/og.png"] },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geist.variable} ${instrumentSerif.variable}`}>{children}</body></html>;
}
