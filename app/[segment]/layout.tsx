import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { htmlLang, isLocale } from "../i18n";
import "../globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });

export const metadata: Metadata = {
  applicationName: "12 Axes Test",
  icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
};

export default async function SegmentRootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ segment: string }> }) {
  const { segment } = await params;
  const lang = isLocale(segment) ? htmlLang[segment] : "en";
  return <html lang={lang}><body className={`${inter.variable} ${sora.variable}`}>{children}</body></html>;
}
