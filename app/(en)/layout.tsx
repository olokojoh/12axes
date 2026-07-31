import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });

export const metadata: Metadata = {
  applicationName: "12 Axes Test",
  icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
};

export default function EnglishRootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className={`${inter.variable} ${sora.variable}`}>{children}</body></html>;
}
