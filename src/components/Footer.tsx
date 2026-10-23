import Link from "next/link";
import { cacheLife } from "next/cache";
import { FaDonate } from "react-icons/fa";
import StickerLogo from "@/components/StickerLogo";
import { DONATE_URL, SOCIAL_LINKS } from "@/content/links";

// Cached so the static shell can include it; refreshed daily for the new year.
async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export default function Footer() {
  return (
    <footer className="border-t border-base-300 bg-base-200">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
        <p className="flex items-center gap-2 text-sm text-muted">
          <StickerLogo className="size-5" />
          &copy; <CopyrightYear /> Ben Gottschalk
        </p>
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          <Link href="/about" className="link link-hover">About</Link>
          <Link href="/contact" className="link link-hover">Contact</Link>
          <a href={DONATE_URL} target="_blank" rel="noopener noreferrer" className="link link-hover inline-flex items-center gap-1.5">
            <FaDonate aria-hidden="true" /> Donate
          </a>
          <span className="flex items-center gap-1">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="btn btn-ghost btn-sm btn-square"
              >
                <Icon className="size-4" aria-hidden="true" />
              </a>
            ))}
          </span>
        </nav>
      </div>
    </footer>
  );
}
