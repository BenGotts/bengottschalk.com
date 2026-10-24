import "@cubing/icons";
import Link from "next/link";
import { cacheLife } from "next/cache";
import StickerLogo from "@/components/StickerLogo";
import { NAV_LINKS, SOCIAL_LINKS, WCA_PROFILE_URL } from "@/content/links";
import ExternalLink from "@/components/ExternalLink";

// Cached so the static shell can include it; refreshed daily for the new year.
async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

function FooterHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">{children}</h2>;
}

export default function Footer() {
  return (
    <footer className="border-t border-base-300 bg-base-200">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-[2fr_1fr_1fr]">
        <div className="space-y-3">
          <Link href="/" className="inline-flex items-center gap-3 font-display text-lg font-bold">
            <StickerLogo className="size-7" />
            Ben Gottschalk
          </Link>
          <p className="max-w-xs text-sm text-muted">
            Competitive cuber, WCA Delegate, and software developer in the Pacific Northwest.
          </p>
        </div>

        <nav aria-labelledby="footer-site">
          <FooterHeading id="footer-site">Site</FooterHeading>
          <ul className="space-y-2 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="link link-hover">{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-elsewhere">
          <FooterHeading id="footer-elsewhere">Elsewhere</FooterHeading>
          <ul className="space-y-2 text-sm">
            <li>
              <ExternalLink href={WCA_PROFILE_URL} className="link link-hover inline-flex items-center gap-2">
                <span className="cubing-icon event-333 text-base" aria-hidden="true" />
                WCA profile
              </ExternalLink>
            </li>
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <li key={href}>
                <ExternalLink href={href} className="link link-hover inline-flex items-center gap-2">
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </ExternalLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-base-300">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-muted sm:flex-row sm:justify-between sm:px-6">
          <p>&copy; <CopyrightYear /> Ben Gottschalk</p>
          <p>
            Competition data from the{" "}
            <ExternalLink href="https://www.worldcubeassociation.org/" className="link link-hover" arrow iconClassName="ml-1 size-3.5">
              World Cube Association
            </ExternalLink>
          </p>
        </div>
      </div>
    </footer>
  );
}
