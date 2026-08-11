import type { Metadata } from "next";
import Link from "next/link";
import { PageSection, StatItem, StatStrip } from "@/components/layout/PageSection";
import { MUSIC_ENSEMBLES } from "@/lib/music-content";

export const metadata: Metadata = {
  title: "Music | Ben Gottschalk",
  description:
    "Ben Gottschalk on trumpet — Hillsboro Symphony Orchestra and OMTAAMB marching band in the Portland metro.",
};

export default function MusicPage() {
  return (
    <div className="-mt-2">
      <header className="relative pb-10 sm:pb-12 border-b border-slate-800/70">
        <div className="absolute inset-0 -mx-4 sm:-mx-6 bg-gradient-to-b from-blue-950/25 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <p className="text-xs font-semibold text-blue-400">Trumpet</p>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-[1.1]">
              Music & Performance
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              When I&apos;m not cubing or writing code, I play trumpet with community ensembles
              across the Portland area — from the concert hall to the Rose Festival parade route.
            </p>
          </div>
          <Link
            href="/contact?topic=music"
            className="text-sm font-bold text-blue-400 hover:underline underline-offset-4 shrink-0"
          >
            Bookings & inquiries →
          </Link>
        </div>
      </header>

      <PageSection className="!py-8 sm:!py-10">
        <StatStrip>
          <StatItem label="Instrument" value="Trumpet" detail="Primary" />
          <StatItem label="Ensembles" value={MUSIC_ENSEMBLES.length} detail="Active groups" />
          <StatItem label="HSO" value="Orchestra" detail="Washington County" />
          <StatItem label="OMTAAMB" value="Marching" detail="Rose Festival" />
        </StatStrip>
      </PageSection>

      <PageSection title="Ensembles">
        <div className="space-y-12 sm:space-y-16">
          {MUSIC_ENSEMBLES.map((ensemble) => (
            <article
              key={ensemble.id}
              id={ensemble.id}
              className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10"
            >
              <div className="lg:col-span-4 space-y-3 border-l-2 border-blue-500/40 pl-5 sm:pl-6">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                  {ensemble.shortName}
                </p>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  {ensemble.name}
                </h2>
                <p className="text-sm font-semibold text-slate-300">{ensemble.role}</p>
              </div>

              <div className="lg:col-span-8 space-y-5">
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                  {ensemble.description}
                </p>

                <ul className="space-y-2">
                  {ensemble.details.map((detail) => (
                    <li key={detail} className="flex gap-2 text-sm text-slate-400 leading-relaxed">
                      <span className="text-blue-400 shrink-0">·</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
                  {ensemble.links.map(({ label, href }) => (
                    <a
                      key={href}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-blue-400 hover:underline"
                    >
                      {label} ↗
                    </a>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </PageSection>

      <PageSection title="Get in touch">
        <p className="text-sm text-slate-400 leading-relaxed max-w-xl mb-4">
          For trumpet bookings, ensemble questions, or music-related inquiries, send a message and
          I&apos;ll get back to you.
        </p>
        <Link
          href="/contact?topic=music"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-blue-800/80 bg-blue-950 text-blue-400 text-sm font-bold hover:border-blue-600 transition-colors"
        >
          Contact — Music
        </Link>
      </PageSection>
    </div>
  );
}
