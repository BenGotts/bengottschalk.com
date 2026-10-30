import Link from "next/link";
import { Suspense } from "react";
import BrandMark from "@/components/BrandMark";
import CubeStripe from "@/components/CubeStripe";
import LiveIndicator from "@/components/LiveIndicator";
import SiteNav from "@/components/SiteNav";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-base-300 bg-base-200/90 backdrop-blur">
      {/* Overlaid, so the header keeps the height sticky offsets (top-16) expect. */}
      <CubeStripe className="absolute inset-x-0 top-0" />
      <nav aria-label="Main" className="navbar mx-auto max-w-6xl gap-2 px-4 sm:px-6">
        <div className="flex-1">
          <Link href="/" className="group inline-flex items-center gap-3 font-display text-xl font-bold">
            <BrandMark />
            Ben Gottschalk
          </Link>
        </div>
        {/* The live dot streams in, so it never holds up the page. */}
        <SiteNav
          cubingIndicator={<Suspense fallback={null}><LiveIndicator placement="inline" /></Suspense>}
          menuIndicator={<Suspense fallback={null}><LiveIndicator placement="corner" /></Suspense>}
        />
        <ThemeToggle />
      </nav>
    </header>
  );
}
