import type { CSSProperties } from "react";
import { LuArrowUpRight } from "react-icons/lu";
import { SITE_NAME, SITE_URL } from "@bengottschalk/content/site";
import { FEATURED_LINKS, SOCIAL_LINKS, type Tone } from "@/links";
import SquareOne from "@bengottschalk/cube/SquareOne";

// Full class names, so Tailwind finds them. Yellow and orange stickers are
// light, so their icons are dark.
const TONE: Record<Tone, { tile: string; hover: string }> = {
  blue: { tile: "bg-cube-blue text-white", hover: "hover:border-cube-blue/70 focus-visible:border-cube-blue/70 hover:shadow-cube-blue/20" },
  green: { tile: "bg-cube-green text-white", hover: "hover:border-cube-green/70 focus-visible:border-cube-green/70 hover:shadow-cube-green/20" },
  yellow: { tile: "bg-cube-yellow text-neutral-900", hover: "hover:border-cube-yellow/70 focus-visible:border-cube-yellow/70 hover:shadow-cube-yellow/20" },
  red: { tile: "bg-cube-red text-white", hover: "hover:border-cube-red/70 focus-visible:border-cube-red/70 hover:shadow-cube-red/20" },
  orange: { tile: "bg-cube-orange text-neutral-900", hover: "hover:border-cube-orange/70 focus-visible:border-cube-orange/70 hover:shadow-cube-orange/20" },
};

const ROLES = [
  { label: "Competitive cuber", dot: "bg-cube-blue" },
  { label: "WCA Delegate", dot: "bg-cube-green" },
  { label: "Software developer", dot: "bg-cube-orange" },
];

// Mostly the site's blue and green, like the website's header stripe.
const STRIPE = [
  { color: "bg-cube-blue", grow: "flex-[4]" },
  { color: "bg-cube-red", grow: "flex-1" },
  { color: "bg-cube-yellow", grow: "flex-1" },
  { color: "bg-cube-green", grow: "flex-[4]" },
  { color: "bg-cube-orange", grow: "flex-1" },
];

/** Staggers an entrance animation; reduced-motion users get none (see motion-safe:). */
const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

export default function LinksPage() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="flex h-1" aria-hidden="true">
        {STRIPE.map(({ color, grow }) => <span key={color} className={`${color} ${grow}`} />)}
      </div>

      {/* Background: soft glows in the cube colors over a faint sticker grid. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="sticker-grid absolute inset-x-0 top-0 h-[34rem]" />
        <div className="absolute -top-32 -left-24 size-96 rounded-full bg-cube-blue/25 blur-3xl" />
        <div className="absolute top-40 -right-28 size-96 rounded-full bg-cube-green/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-72 rounded-full bg-cube-orange/10 blur-3xl" />
      </div>

      <main className="mx-auto flex w-full max-w-md flex-col items-center gap-9 px-4 pt-14 pb-10">
        <header className="flex flex-col items-center gap-4 text-center">
          {/* A self-solving Square-1, cycling through my Square-1 solves.
              It draws past its box in 3D, so it gets room above and below. */}
          <SquareOne className="my-8 [--sq:3rem]" />
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-bold tracking-tight">{SITE_NAME}</h1>
            <p className="text-sm text-muted">@bengotts · Pacific Northwest</p>
          </div>
          <ul className="flex flex-wrap justify-center gap-2" aria-label="About me">
            {ROLES.map(({ label, dot }) => (
              <li key={label} className="flex items-center gap-1.5 rounded-full border border-base-300 bg-base-200/60 px-3 py-1 text-xs font-medium backdrop-blur">
                <span className={`size-2 rounded-[2px] ${dot}`} aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </header>

        <ul className="flex w-full flex-col gap-3">
          {FEATURED_LINKS.map(({ label, description, href, icon: Icon, tone }, i) => (
            <li key={href} className="motion-safe:animate-rise-in" style={delay(400 + i * 80)}>
              <a
                href={href}
                className={`group flex items-center gap-4 rounded-box border border-base-300 bg-base-200/70 p-3 pr-4 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:-translate-y-0.5 ${TONE[tone].hover}`}
              >
                <span className={`grid size-12 shrink-0 place-items-center rounded-field shadow-sm transition-transform duration-200 group-hover:-rotate-6 ${TONE[tone].tile}`}>
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">{label}</span>
                  {description && <span className="truncate text-sm text-muted">{description}</span>}
                </span>
                <LuArrowUpRight
                  className="size-5 shrink-0 text-muted transition duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-base-content"
                  aria-hidden="true"
                />
              </a>
            </li>
          ))}
        </ul>

        <ul className="flex flex-wrap justify-center gap-3 motion-safe:animate-rise-in" style={delay(400 + FEATURED_LINKS.length * 80)}>
          {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
            <li key={href}>
              <a
                href={href}
                aria-label={label}
                title={label}
                className="grid size-12 place-items-center rounded-field border border-base-300 bg-base-200/70 text-muted backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-primary hover:text-base-content focus-visible:border-primary focus-visible:text-base-content"
              >
                <Icon className="size-5" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>

        <footer className="text-xs text-muted">
          <a href={SITE_URL} className="link link-hover">{SITE_URL.replace(/^https?:\/\//, "")}</a>
        </footer>
      </main>
    </div>
  );
}
