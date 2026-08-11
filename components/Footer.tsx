import Link from "next/link";
import type { ReactNode } from "react";
import { BackToTopButton } from "@/components/BackToTopButton";
import { FooterClockBadge } from "@/components/FooterClockBadge";
import { MY_WCA_ID } from "@/lib/wca";
import { PNW_CUBING_URL } from "@/lib/pnw-cubing";
import { getSolveDetailPath, getTodayDatePT } from "@/lib/solves";

function FooterLink({
  href,
  children,
  external,
  className,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  className?: string;
}) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function LinkGroup({
  label,
  labelClass,
  children,
}: {
  label: string;
  labelClass: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 min-w-0">
      <p className={`text-[10px] font-bold uppercase tracking-[0.18em] sm:tracking-[0.2em] ${labelClass}`}>
        {label}
      </p>
      <div className="flex flex-col gap-2 text-sm text-slate-400">{children}</div>
    </div>
  );
}

function StatusBadge({
  children,
  className = "bg-slate-900 text-slate-400 border-slate-800",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded border ${className}`}
    >
      {children}
    </span>
  );
}

const linkHover = "hover:text-white transition-colors w-fit max-w-full break-words";

export function Footer() {
  const today = getTodayDatePT();

  const todaySolves = [
    { event: "333" as const, label: "3x3", longLabel: "Today's 3x3" },
    { event: "sq1" as const, label: "SQ1", longLabel: "Today's SQ1" },
    { event: "333bf" as const, label: "3BLD", longLabel: "Today's 3BLD" },
  ];

  return (
    <footer className="mt-12 sm:mt-16 lg:mt-20 w-full overflow-x-hidden border-t border-slate-800 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 lg:py-12 space-y-8 sm:space-y-10 lg:space-y-12">

        {/* Brand + today's solves */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3 min-w-0">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 text-xl sm:text-2xl font-black text-white tracking-tight"
            >
              <div className="relative w-6 h-6 sm:w-7 sm:h-7 shrink-0 flex items-center justify-center">
                <span className="cubing-icon event-sq1 text-cyan-400 text-xl sm:text-2xl absolute inset-0 transition-all duration-300 group-hover:opacity-0 group-hover:scale-75 group-hover:rotate-12 flex items-center justify-center" />
                <span className="cubing-icon event-333 text-emerald-400 text-xl sm:text-2xl absolute inset-0 opacity-0 scale-75 -rotate-12 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-0 flex items-center justify-center" />
              </div>
              <span className="break-words">Ben Gottschalk</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <FooterClockBadge />
              <StatusBadge className="bg-emerald-950 text-emerald-400 border-emerald-800/80">
                WCA {MY_WCA_ID}
              </StatusBadge>
              <StatusBadge className="bg-sky-950 text-sky-400 border-sky-800/80">
                Pacific Northwest
              </StatusBadge>
            </div>

            <p className="text-sm text-slate-500 max-w-prose leading-relaxed">
              Software engineer · WCA regional delegate · Square-1 · Trumpet
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-wrap gap-2 w-full lg:w-auto lg:max-w-xl">
            {todaySolves.map(({ event, label, longLabel }) => (
              <FooterLink
                key={event}
                href={getSolveDetailPath(today, event)}
                className="inline-flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-full border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-300 hover:border-cyan-700 hover:text-cyan-300 transition-colors min-w-0"
              >
                <span className={`cubing-icon event-${event} text-sm sm:text-base text-slate-400 shrink-0`} />
                <span className="truncate sm:hidden">{label}</span>
                <span className="truncate hidden sm:inline">{longLabel}</span>
              </FooterLink>
            ))}
            <FooterLink
              href="/content"
              className="inline-flex items-center justify-center px-2.5 sm:px-3 py-2 rounded-full border border-dashed border-slate-700 text-xs font-semibold text-slate-500 hover:text-cyan-400 hover:border-cyan-800 transition-colors"
            >
              Archive
            </FooterLink>
          </div>
        </div>

        {/* Link grid */}
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 pt-6 sm:pt-8 border-t border-slate-800/80">
          <LinkGroup label="Site" labelClass="text-slate-500">
            <FooterLink href="/" className={linkHover}>Home</FooterLink>
            <FooterLink href="/cubing" className={`${linkHover} hover:text-emerald-400`}>Cubing</FooterLink>
            <FooterLink href="/content" className={`${linkHover} hover:text-cyan-400`}>Content</FooterLink>
            <FooterLink href="/contact" className={`${linkHover} hover:text-sky-400`}>Contact</FooterLink>
          </LinkGroup>

          <LinkGroup label="Cubing" labelClass="text-emerald-500/80">
            <FooterLink
              href={`${PNW_CUBING_URL}/competitions`}
              external
              className={`${linkHover} hover:text-emerald-400`}
            >
              PNW Competitions ↗
            </FooterLink>
            <FooterLink
              href={PNW_CUBING_URL}
              external
              className={`${linkHover} hover:text-emerald-400`}
            >
              pnwcubing.com ↗
            </FooterLink>
            <FooterLink href="/cubing" className={`${linkHover} hover:text-emerald-400`}>My Cubing Profile</FooterLink>
            <FooterLink
              href={`https://www.worldcubeassociation.org/persons/${MY_WCA_ID}`}
              external
              className={`${linkHover} hover:text-emerald-400`}
            >
              WCA Profile ↗
            </FooterLink>
          </LinkGroup>

          <LinkGroup label="Work & Music" labelClass="text-sky-500/80">
            <FooterLink href="/tech" className={`${linkHover} hover:text-sky-400`}>Tech Portfolio</FooterLink>
            <FooterLink href="/contact?topic=tech" className={`${linkHover} hover:text-sky-400`}>Side projects</FooterLink>
            <FooterLink href="/music#symphony" className={`${linkHover} hover:text-blue-400`}>Hillsboro Symphony</FooterLink>
            <FooterLink href="/music#marching" className={`${linkHover} hover:text-blue-400`}>OMTAAMB</FooterLink>
          </LinkGroup>
        </div>

        {/* Utility bar */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 pt-6 border-t border-slate-800/80 text-xs text-slate-600">
          <p className="text-center sm:text-left">© {new Date().getFullYear()} Ben Gottschalk</p>
          <div className="flex justify-center sm:justify-end">
            <BackToTopButton />
          </div>
        </div>
      </div>
    </footer>
  );
}
