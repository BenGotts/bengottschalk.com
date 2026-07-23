import Image from "next/image";
import Link from "next/link";
import MapWrapper from "@/components/MapWrapper";
import { PageSection, StatItem, StatStrip } from "@/components/layout/PageSection";
import { SolveOfTheDayStrip } from "@/components/SolveOfTheDayStrip";
import { PNW_CUBING_URL } from "@/lib/pnw-cubing";
import {
  MY_WCA_ID,
  getWcaProfile,
  getWcaUserData,
  getWcaCompetitions,
  filterMapCompetitions,
  formatWcaResult,
  getUpcomingCompetitions,
  getOngoingCompetitions,
  getNextCompetition,
  isOngoingCompetition,
} from "@/lib/wca";

const PILLARS = [
  { href: "/cubing", label: "Cubing", accent: "text-emerald-400" },
  { href: "/content", label: "Content", accent: "text-cyan-400" },
  { href: "/tech", label: "Tech", accent: "text-sky-400" },
  { href: "/music", label: "Music", accent: "text-blue-400" },
];

export default async function HomePage() {
  const [profileData, userData, allComps] = await Promise.all([
    getWcaProfile(),
    getWcaUserData(),
    getWcaCompetitions(),
  ]);

  const person = profileData?.person ?? {};
  const upcomingComps = getUpcomingCompetitions(userData);
  const ongoingComps = getOngoingCompetitions(userData);
  const featuredComp = getNextCompetition(userData);
  const featuredIsOngoing = featuredComp ? isOngoingCompetition(userData, featuredComp.id) : false;
  const today = new Date().toISOString().split("T")[0];
  const mapComps = filterMapCompetitions(allComps, upcomingComps, ongoingComps, today);

  const prs = profileData?.personal_records ?? {};
  const sq1Single = formatWcaResult(prs?.sq1?.single?.best, "sq1");
  const sq1Average = formatWcaResult(prs?.sq1?.average?.best, "sq1", true);
  const cube333Single = formatWcaResult(prs?.["333"]?.single?.best, "333");
  const cube333Average = formatWcaResult(prs?.["333"]?.average?.best, "333", true);

  const goldMedals = profileData?.medals?.gold ?? 0;
  const compCount = profileData?.competition_count ?? 0;

  return (
    <div className="-mt-2">
      {/* Hero */}
      <header className="relative pb-10 sm:pb-12 border-b border-slate-800/70">
        <div className="absolute inset-0 -mx-4 sm:-mx-6 bg-gradient-to-b from-emerald-950/25 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6 min-w-0">
            {person?.avatar?.url && (
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-2 ring-emerald-500/30 shrink-0">
                <Image
                  src={person.avatar.url}
                  alt={person.name ?? "Ben Gottschalk"}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="space-y-4 min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold">
                <span className="text-emerald-400">WCA Regional Delegate</span>
                <span className="text-slate-600 hidden sm:inline">·</span>
                <span className="text-slate-400">Pacific Northwest</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.1]">
                Ben Gottschalk
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                I solve Rubik&apos;s cubes fast, delegate WCA competitions across Oregon and the
                PNW, build software, post daily solves, and play trumpet.
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold shrink-0">
            {PILLARS.map(({ href, label, accent }) => (
              <Link key={href} href={href} className={`${accent} hover:underline underline-offset-4`}>
                {label} →
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Stats */}
      <PageSection className="!py-8 sm:!py-10">
        <StatStrip>
          <StatItem label="Gold Medals" value={goldMedals} detail="Official podiums" />
          <StatItem label="Competitions" value={compCount} detail="Since 2016" />
          <StatItem
            label="SQ1 Single"
            value={sq1Single}
            detail={
              prs?.sq1?.single?.world_rank
                ? `World #${prs.sq1.single.world_rank}`
                : "Official PR"
            }
          />
          <StatItem
            label="WCA ID"
            value={<span className="font-mono text-xl sm:text-2xl text-sky-400">{MY_WCA_ID}</span>}
            detail={
              <Link href="/cubing" className="text-sky-400 hover:underline">
                View profile →
              </Link>
            }
          />
        </StatStrip>
      </PageSection>

      {/* Personal records */}
      <PageSection title="Personal Records">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          <div className="space-y-4 border-l-2 border-cyan-500/60 pl-5 sm:pl-6">
            <div className="flex items-center gap-2">
              <span className="cubing-icon event-sq1 text-cyan-400 text-xl" />
              <h3 className="text-lg font-black text-white">Square-1</h3>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider ml-1">
                Main
              </span>
            </div>
            <div className="flex gap-10">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Single</p>
                <p className="text-3xl font-black text-white tabular-nums mt-0.5">{sq1Single}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Average</p>
                <p className="text-3xl font-black text-white tabular-nums mt-0.5">{sq1Average}</p>
              </div>
            </div>
            <Link href="/content" className="inline-block text-sm font-bold text-cyan-400 hover:underline">
              Watch SQ1 reconstructions →
            </Link>
          </div>

          <div className="space-y-4 border-l-2 border-sky-500/40 pl-5 sm:pl-6">
            <div className="flex items-center gap-2">
              <span className="cubing-icon event-333 text-sky-400 text-xl" />
              <h3 className="text-lg font-black text-white">3x3x3 Cube</h3>
            </div>
            <div className="flex gap-10">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Single</p>
                <p className="text-3xl font-black text-white tabular-nums mt-0.5">{cube333Single}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Average</p>
                <p className="text-3xl font-black text-white tabular-nums mt-0.5">{cube333Average}</p>
              </div>
            </div>
            <Link href="/cubing" className="inline-block text-sm font-bold text-sky-400 hover:underline">
              All official PRs →
            </Link>
          </div>
        </div>
      </PageSection>

      <SolveOfTheDayStrip />

      {/* Map + next comp */}
      <PageSection
        title="Competition Journey"
        actions={
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold">
            <Link href="/cubing" className="text-emerald-400 hover:underline">
              My profile →
            </Link>
            <a
              href={PNW_CUBING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400/80 hover:underline"
            >
              pnwcubing.com →
            </a>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-8 h-64 sm:h-80 w-full rounded-lg overflow-hidden ring-1 ring-slate-800">
            <MapWrapper comps={mapComps} />
          </div>

          <aside className="lg:col-span-4 flex flex-col justify-center space-y-4">
            {featuredComp ? (
              <>
                <p
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    featuredIsOngoing ? "text-emerald-400" : "text-sky-400"
                  }`}
                >
                  {featuredIsOngoing ? "Live Now — Attending" : "Next Competition"}
                </p>
                <h3 className="text-xl font-black text-white leading-snug">{featuredComp.name}</h3>
                <p className="text-sm text-slate-400">{featuredComp.city}</p>
                <p className="text-sm font-mono text-slate-500">
                  {featuredComp.date_range ?? featuredComp.start_date}
                </p>
                {featuredComp.url && (
                  <a
                    href={featuredComp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-sm font-bold hover:underline ${
                      featuredIsOngoing ? "text-emerald-400" : "text-sky-400"
                    }`}
                  >
                    WCA listing →
                  </a>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-slate-500">
                  No ongoing or upcoming competitions on the calendar right now.
                </p>
                <Link href="/cubing" className="text-sm font-bold text-sky-400 hover:underline">
                  Browse comp history →
                </Link>
              </>
            )}
          </aside>
        </div>
      </PageSection>

      {/* Beyond cubing */}
      <PageSection title="Beyond Cubing">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {[
            {
              label: "Software",
              title: "Tech & Engineering",
              desc: "Open-source tools, WCA API utilities, and modern Next.js apps for the cubing community.",
              href: "/tech",
              accent: "text-sky-400",
            },
            {
              label: "Creator",
              title: "Daily Solves",
              desc: "A new 3x3, Square-1, and 3BLD solve every day — scrambles, reconstructions, and video.",
              href: "/content",
              accent: "text-cyan-400",
            },
            {
              label: "Performance",
              title: "Music & Trumpet",
              desc: "Hillsboro Symphony Orchestra and OMTAAMB — orchestral and marching brass.",
              href: "/music",
              accent: "text-blue-400",
            },
          ].map(({ label, title, desc, href, accent }) => (
            <article key={href} className="space-y-3">
              <p className={`text-[11px] font-bold uppercase tracking-wider ${accent}`}>{label}</p>
              <h3 className="text-lg font-black text-white">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              <Link href={href} className={`inline-block text-sm font-bold ${accent} hover:underline`}>
                Learn more →
              </Link>
            </article>
          ))}
        </div>
      </PageSection>
    </div>
  );
}
