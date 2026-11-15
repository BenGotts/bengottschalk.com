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
      <CubeStripe />
      {/* 4px shorter than DaisyUI's navbar, to make room for the stripe: the header keeps
          the height sticky offsets (top-16) expect, and its contents sit centred under the stripe. */}
      <nav aria-label="Main" className="navbar mx-auto min-h-15 max-w-6xl gap-2 px-4 sm:px-6">
        {/* A flex row, so the name lines up with the buttons instead of sitting on a text baseline. */}
        <div className="flex flex-1 items-center">
          <Link href="/" className="group inline-flex items-center gap-3">
            <BrandMark />
            {/* A signature script; it reads small, so it's set larger than the other header text, and
                its tall capitals and loops sit it high, so it's nudged down to centre with the logo. */}
            <span className="translate-y-0.5 font-signature text-[1.75rem] leading-none">Ben Gottschalk</span>
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
