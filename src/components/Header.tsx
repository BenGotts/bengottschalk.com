import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import SiteNav from "@/components/SiteNav";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-base-300 bg-base-200/90 backdrop-blur">
      <nav aria-label="Main" className="navbar mx-auto max-w-6xl gap-2 px-4 sm:px-6">
        <div className="flex-1">
          <Link href="/" className="group inline-flex items-center gap-3 font-display text-xl font-bold">
            <BrandMark />
            Ben Gottschalk
          </Link>
        </div>
        <SiteNav />
        <ThemeToggle />
      </nav>
    </header>
  );
}
