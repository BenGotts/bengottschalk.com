import type { Metadata, Viewport } from "next";
import { DM_Mono, DM_Sans } from "next/font/google";
import "@cubing/icons";
import "./globals.css";
import { THEMES, themeInitScript } from "@bengottschalk/theme";
import { TIMER_URL } from "@bengottschalk/content/site";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(TIMER_URL),
  title: "Cube Timer",
  description: "A speedcubing timer with every WCA event, official scrambles, sessions with branches and Solve of the Day.",
  appleWebApp: { capable: true, title: "Timer", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0B1220",
  // The timer is held with a thumb; zooming on a double tap would get in the way.
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme={THEMES.dark}
      className={`${dmSans.variable} ${dmMono.variable}`}
      // The theme script may change data-theme before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh bg-base-100 font-sans text-base-content antialiased">{children}</body>
    </html>
  );
}
