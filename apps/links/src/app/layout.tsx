import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { THEMES } from "@bengottschalk/theme";
import { LINKS_URL, SITE_DESCRIPTION, SITE_NAME } from "@bengottschalk/content/site";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(LINKS_URL),
  title: `${SITE_NAME} · Links`,
  description: SITE_DESCRIPTION,
};

export const viewport: Viewport = {
  themeColor: "#0B1220",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme={THEMES.dark} className={dmSans.variable}>
      <body className="min-h-screen bg-base-100 font-sans text-base-content antialiased">{children}</body>
    </html>
  );
}
