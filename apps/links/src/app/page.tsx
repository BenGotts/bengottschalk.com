import { SITE_NAME } from "@bengottschalk/content/site";
import { FEATURED_LINKS, SOCIAL_LINKS } from "@/links";

// A 3×3 cube face, the same as icon.svg.
const STICKERS = [
  "#0051BA", "#F4F4F4", "#009E60",
  "#C41E3A", "#FFD500", "#FF5800",
  "#009E60", "#0051BA", "#F4F4F4",
];

function StickerLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 30 30" aria-hidden="true">
      <rect width="30" height="30" rx="7" fill="#0D0D0F" />
      {STICKERS.map((color, i) => (
        <rect key={i} x={3 + (i % 3) * 8.5} y={3 + Math.floor(i / 3) * 8.5} width="7" height="7" rx="1.5" fill={color} />
      ))}
    </svg>
  );
}

export default function LinksPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-8 px-4 py-12">
      <header className="flex flex-col items-center gap-3 text-center">
        <StickerLogo className="size-20" />
        <h1 className="text-2xl font-bold">{SITE_NAME}</h1>
        <p className="text-muted">Competitive cuber, WCA Delegate, and software developer.</p>
      </header>

      <ul className="flex w-full flex-col gap-3">
        {FEATURED_LINKS.map(({ label, description, href, icon: Icon }) => (
          <li key={href}>
            <a
              href={href}
              className="flex items-center gap-4 rounded-box border border-base-300 bg-base-200 px-5 py-4 transition-colors hover:border-primary focus-visible:border-primary"
            >
              <Icon className="size-6 shrink-0 text-primary" aria-hidden="true" />
              <span className="flex flex-col">
                <span className="font-semibold">{label}</span>
                {description && <span className="text-sm text-muted">{description}</span>}
              </span>
            </a>
          </li>
        ))}
      </ul>

      <ul className="flex flex-wrap justify-center gap-2">
        {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
          <li key={href}>
            <a href={href} className="btn btn-circle btn-ghost btn-lg" aria-label={label} title={label}>
              <Icon className="size-6" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
