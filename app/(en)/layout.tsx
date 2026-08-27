/* eslint-disable @next/next/no-sync-scripts -- Adsterra requires its vendor snippets without async or defer. */
import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import Script from "next/script";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });

export const metadata: Metadata = {
  applicationName: "12 Axes Test",
  icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
};

export default function EnglishRootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><head><script src="https://pl31051933.profitableratecpmnetwork.com/eb/3f/2b/eb3f2b4f596dc0ce02129439525e0ca9.js" /></head><body className={`${inter.variable} ${sora.variable}`}>{children}<Script src="https://www.googletagmanager.com/gtag/js?id=G-CE8EXPY4K6" strategy="afterInteractive" /><Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-CE8EXPY4K6');`}</Script><script src="https://pl31051935.profitableratecpmnetwork.com/a2/fe/62/a2fe6205958e31ff19ac56d46d23af7e.js" /></body></html>;
}
