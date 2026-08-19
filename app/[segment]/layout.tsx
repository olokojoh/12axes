import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import Script from "next/script";
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
  return <html lang={lang}><body className={`${inter.variable} ${sora.variable}`}>{children}<Script src="https://www.googletagmanager.com/gtag/js?id=G-CE8EXPY4K6" strategy="afterInteractive" /><Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-CE8EXPY4K6');`}</Script></body></html>;
}
