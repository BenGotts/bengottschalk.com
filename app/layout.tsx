// app/layout.tsx
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ben Gottschalk | Software Engineer, WCA Delegate & Trumpeter",
  description: "Personal hub for Ben Gottschalk—Software Engineer, WCA Regional Delegate, Square-1 Specialist, Trumpeter, and Content Creator based in the PNW.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-slate-950">
      <body 
        className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between antialiased"
        suppressHydrationWarning
      >
        <div>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {children}
          </main>
        </div>
        <Footer />
      </body>
    </html>
  );
}