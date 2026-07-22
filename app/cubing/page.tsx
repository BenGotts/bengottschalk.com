import Image from "next/image";
import Link from "next/link";
import { BentoCard } from "@/components/BentoCard";
import MapWrapper from "@/components/MapWrapper";
import {
  MY_WCA_ID,
  EVENT_NAMES,
  ACTIVE_EVENT_ORDER,
  formatWcaResult,
  getWcaProfile,
  getWcaUserData,
  getWcaCompetitions,
  filterMapCompetitions,
} from "@/lib/wca";

export default async function CubingPage() {
  const [wcaProfile, userData, allComps] = await Promise.all([
    getWcaProfile(),
    getWcaUserData(),
    getWcaCompetitions(),
  ]);

  const person = wcaProfile?.person ?? {};
  const prs = wcaProfile?.personal_records ?? {};
  const medals = wcaProfile?.medals ?? { gold: 0, silver: 0, bronze: 0, total: 0 };
  const today = new Date().toISOString().split("T")[0];
  
  const upcomingComps = Array.isArray(userData?.upcoming_competitions) ? userData.upcoming_competitions : [];
  const pastCompsForMap = filterMapCompetitions(allComps, upcomingComps, today);

  const sortedActivePrs = Object.entries(prs)
    .filter(([eventId]) => ACTIVE_EVENT_ORDER.includes(eventId))
    .sort(([a], [b]) => ACTIVE_EVENT_ORDER.indexOf(a) - ACTIVE_EVENT_ORDER.indexOf(b));

  return (
    <div className="space-y-6">
      {/* 1. HEADER & SPECIALTY BANNER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <BentoCard hoverColor="emerald" className="lg:col-span-2 justify-between">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {person?.avatar?.url && (
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-slate-700 shrink-0">
                <Image src={person.avatar.url} alt={person.name ?? "WCA Avatar"} fill sizes="96px" className="object-cover" />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/80 text-[11px] font-bold px-2 py-0.5 rounded">
                  WCA Regional Delegate
                </span>
                <span className="bg-slate-900 text-slate-300 border border-slate-800 text-[11px] font-semibold px-2 py-0.5 rounded">
                  WCA ID: {person?.wca_id ?? MY_WCA_ID}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{person?.name ?? "Benjamin Gottschalk"}</h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Competing since 2016. Delegating official WCA competitions across Oregon and the Pacific Northwest while specializing in Square-1.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/60 mt-4">
            <span className="text-xs text-slate-400 font-medium">📍 {person?.location ?? "Pacific Northwest"}</span>
            <a href={person?.url ?? `https://www.worldcubeassociation.org/persons/${MY_WCA_ID}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1">
              Official WCA Profile &rarr;
            </a>
          </div>
        </BentoCard>

        {/* Square-1 Specialty Card */}
        <BentoCard hoverColor="cyan" className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Main Specialty</span>
              <h2 className="text-xl font-black text-white mt-0.5">Square-1</h2>
            </div>
            <span className="cubing-icon event-sq1 text-cyan-300 text-3xl" />
          </div>
          <div className="grid grid-cols-2 gap-2 my-3">
            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-cyan-800/50">
              <div className="text-[10px] text-slate-400 font-bold uppercase">PR Single</div>
              <div className="text-base font-black text-cyan-300">{formatWcaResult(prs?.sq1?.single?.best, "sq1", false)}</div>
              <div className="text-[10px] text-emerald-400 font-semibold">World #{prs?.sq1?.single?.world_rank ?? "—"}</div>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-cyan-800/50">
              <div className="text-[10px] text-slate-400 font-bold uppercase">PR Average</div>
              <div className="text-base font-black text-cyan-300">{formatWcaResult(prs?.sq1?.average?.best, "sq1", true)}</div>
              <div className="text-[10px] text-emerald-400 font-semibold">World #{prs?.sq1?.average?.world_rank ?? "—"}</div>
            </div>
          </div>
          <Link href="/content#sq1" className="text-xs font-bold text-cyan-400 hover:underline">
            Watch SQ1 Reconstructions &rarr;
          </Link>
        </BentoCard>
      </div>

      {/* 2. STATS OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BentoCard hoverColor="emerald">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Competitions</span>
          <div className="text-2xl sm:text-3xl font-black text-white my-1">{wcaProfile?.competition_count ?? 0}</div>
          <span className="text-[11px] text-slate-400">Official Attended</span>
        </BentoCard>
        <BentoCard hoverColor="emerald">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Podiums</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 my-1">{medals.total}</div>
          <div className="text-[10px] text-slate-300 flex gap-2">
            <span>🥇 {medals.gold}</span>
            <span>🥈 {medals.silver}</span>
            <span>🥉 {medals.bronze}</span>
          </div>
        </BentoCard>
        <BentoCard hoverColor="sky">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Solves</span>
          <div className="text-2xl sm:text-3xl font-black text-sky-400 my-1">{(wcaProfile?.total_solves ?? 0).toLocaleString()}</div>
          <span className="text-[11px] text-slate-400">Completed in Comp</span>
        </BentoCard>
        <BentoCard hoverColor="cyan">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Continental Rec</span>
          <div className="text-2xl sm:text-3xl font-black text-cyan-300 my-1">{wcaProfile?.records?.continental ?? 1}</div>
          <span className="text-[11px] text-slate-400">North American Record</span>
        </BentoCard>
      </div>

      {/* 3. UPCOMING SCHEDULE */}
      <div className="bg-slate-900/60 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Upcoming Competitions</h2>
            <p className="text-xs text-slate-400">Delegating, organizing, and competing across the PNW.</p>
          </div>
          <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800/80 font-bold px-2.5 py-1 rounded">
            {upcomingComps.length} Scheduled
          </span>
        </div>

        {upcomingComps.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No upcoming competitions currently scheduled on the WCA calendar.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingComps.map((comp: any) => {
              const isDelegate = comp.delegates?.some((d: any) => d.wca_id === MY_WCA_ID);
              const isOrganizer = comp.organizers?.some((o: any) => o.wca_id === MY_WCA_ID);

              return (
                <div key={comp.id} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      {isDelegate && <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/80 text-[9px] font-bold px-1.5 py-0.5 rounded">Delegate</span>}
                      {isOrganizer && <span className="bg-sky-950 text-sky-400 border border-sky-800/80 text-[9px] font-bold px-1.5 py-0.5 rounded">Organizer</span>}
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug">{comp.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{comp.city}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-900">
                    <div className="text-[10px] text-slate-500 font-medium mb-1">Events:</div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {comp.event_ids?.map((eventId: string) => (
                        <span key={eventId} title={EVENT_NAMES[eventId] || eventId} className={`cubing-icon event-${eventId} text-base text-slate-300 hover:text-emerald-400 transition-colors`} />
                      ))}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-900/60 flex justify-between items-center">
                    <span>🗓️ {comp.date_range}</span>
                    <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline font-bold">WCA &rarr;</a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. PERSONAL RECORDS GRID */}
      <div className="bg-slate-900/60 rounded-2xl p-4 sm:p-6 border border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Official Personal Records</h2>
            <p className="text-xs text-slate-400">Formatted using @wca/helpers. Multi-Blind has no average column.</p>
          </div>
          <span className="text-xs bg-slate-950 text-slate-400 border border-slate-800 px-2.5 py-1 rounded font-mono">
            {sortedActivePrs.length} Active Events
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedActivePrs.map(([eventId, eventData]: [string, any]) => {
            const { single, average } = eventData;
            const isSq1 = eventId === "sq1";
            const isMbf = eventId === "333mbf";

            return (
              <div key={eventId} className={`p-3 rounded-xl border transition-all ${isSq1 ? "bg-cyan-950/30 border-cyan-500/50" : "bg-slate-950/60 border-slate-800 hover:border-slate-700"}`}>
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className={`cubing-icon event-${eventId} text-lg ${isSq1 ? "text-cyan-400" : "text-slate-300"}`} />
                    <span className="text-xs font-bold text-white">{EVENT_NAMES[eventId] || eventId}</span>
                  </div>
                  {isSq1 && <span className="text-[9px] bg-cyan-950 text-cyan-300 font-bold px-1.5 py-0.5 rounded border border-cyan-800">MAIN</span>}
                </div>
                <div className={`grid ${isMbf ? "grid-cols-1" : "grid-cols-2"} gap-2 text-xs`}>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium uppercase">Single</div>
                    <div className="font-bold text-slate-200">{formatWcaResult(single?.best, eventId, false)}</div>
                    {single?.world_rank && <div className="text-[9px] text-slate-400">WR #{single.world_rank}</div>}
                  </div>
                  {!isMbf && (
                    <div>
                      <div className="text-[10px] text-slate-500 font-medium uppercase">Average</div>
                      <div className="font-bold text-slate-200">{formatWcaResult(average?.best, eventId, true)}</div>
                      {average?.world_rank && <div className="text-[9px] text-slate-400">WR #{average.world_rank}</div>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. HISTORY MAP */}
      <div className="bg-slate-900/60 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3">
        <div>
          <h2 className="text-lg font-bold text-white">Competition History Map</h2>
          <p className="text-xs text-slate-400">Interactive map of past single-venue competitions ({pastCompsForMap.length} mapped).</p>
        </div>
        <MapWrapper comps={pastCompsForMap} />
      </div>
    </div>
  );
}