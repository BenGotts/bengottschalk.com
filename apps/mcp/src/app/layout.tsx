import type { Metadata } from "next";
import { DM_Mono, DM_Sans } from "next/font/google";
import "./globals.css";
import { THEMES } from "@bengottschalk/theme";
import { MCP_URL, SITE_NAME } from "@bengottschalk/content/site";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(MCP_URL),
  title: `${SITE_NAME} · MCP server`,
  description: `An MCP server for asking AI assistants about ${SITE_NAME}.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme={THEMES.dark} className={`${dmSans.variable} ${dmMono.variable}`}>
      <body className="min-h-screen bg-base-100 font-sans text-base-content antialiased">{children}</body>
    </html>
  );
}
