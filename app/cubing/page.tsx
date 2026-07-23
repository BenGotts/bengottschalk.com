import Image from "next/image";

import Link from "next/link";

import { PnwCubingHub } from "@/components/cubing/PnwCubingHub";

import { PageSection, StatItem, StatStrip } from "@/components/layout/PageSection";

import MapWrapper from "@/components/MapWrapper";

import { PNW_CUBING_URL } from "@/lib/pnw-cubing";

import {

  MY_WCA_ID,

  EVENT_NAMES,

  ACTIVE_EVENT_ORDER,

  formatWcaResult,

  getWcaProfile,

  getWcaUserData,

  getWcaCompetitions,

  filterMapCompetitions,

  getUpcomingCompetitions,

  getOngoingCompetitions,

  getScheduledCompetitions,

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



  const upcomingComps = getUpcomingCompetitions(userData);

  const ongoingComps = getOngoingCompetitions(userData);

  const scheduledComps = getScheduledCompetitions(userData);

  const pastCompsForMap = filterMapCompetitions(allComps, upcomingComps, ongoingComps, today);



  const sortedActivePrs = Object.entries(prs)

    .filter(([eventId]) => ACTIVE_EVENT_ORDER.includes(eventId))

    .sort(([a], [b]) => ACTIVE_EVENT_ORDER.indexOf(a) - ACTIVE_EVENT_ORDER.indexOf(b));



  return (

    <div className="-mt-2">

      {/* Hero */}

      <header className="relative pb-10 sm:pb-12 border-b border-slate-800/70">

        <div className="absolute inset-0 -mx-4 sm:-mx-6 bg-gradient-to-br from-emerald-950/20 via-transparent to-cyan-950/15 pointer-events-none" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          <div className="lg:col-span-7 flex flex-col sm:flex-row items-start gap-5">

            {person?.avatar?.url && (

              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-2 ring-emerald-500/30 shrink-0">

                <Image

                  src={person.avatar.url}

                  alt={person.name ?? "WCA Avatar"}

                  fill

                  sizes="96px"

                  className="object-cover"

                />

              </div>

            )}

            <div className="space-y-3 min-w-0">

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold">

                <span className="text-emerald-400">WCA Regional Delegate</span>

                <span className="text-slate-600 hidden sm:inline">·</span>

                <span className="text-slate-400 font-mono">{person?.wca_id ?? MY_WCA_ID}</span>

              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">

                {person?.name ?? "Benjamin Gottschalk"}

              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">

                Competing since 2016. WCA regional delegate for Oregon and the Pacific Northwest.

                For regional comps and community resources, see{" "}

                <a

                  href={PNW_CUBING_URL}

                  target="_blank"

                  rel="noopener noreferrer"

                  className="text-emerald-400 hover:underline font-semibold"

                >

                  pnwcubing.com

                </a>

                .

              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-sm">

                <span className="text-slate-400">{person?.location ?? "Pacific Northwest"}</span>

                <a

                  href={person?.url ?? `https://www.worldcubeassociation.org/persons/${MY_WCA_ID}`}

                  target="_blank"

                  rel="noopener noreferrer"

                  className="font-bold text-emerald-400 hover:underline"

                >

                  Official WCA Profile →

                </a>

              </div>

            </div>

          </div>



          <aside className="lg:col-span-5 border-l-2 border-cyan-500/50 pl-5 sm:pl-6 space-y-4">

            <div className="flex items-center justify-between gap-3">

              <div>

                <p className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Main Specialty</p>

                <h2 className="text-xl font-black text-white">Square-1</h2>

              </div>

              <span className="cubing-icon event-sq1 text-cyan-400/70 text-3xl" />

            </div>

            <div className="flex gap-8">

              <div>

                <p className="text-[11px] font-bold text-slate-500 uppercase">PR Single</p>

                <p className="text-2xl font-black text-cyan-300 tabular-nums mt-0.5">

                  {formatWcaResult(prs?.sq1?.single?.best, "sq1", false)}

                </p>

                <p className="text-xs text-emerald-400 font-semibold mt-0.5">

                  World #{prs?.sq1?.single?.world_rank ?? "—"}

                </p>

              </div>

              <div>

                <p className="text-[11px] font-bold text-slate-500 uppercase">PR Average</p>

                <p className="text-2xl font-black text-cyan-300 tabular-nums mt-0.5">

                  {formatWcaResult(prs?.sq1?.average?.best, "sq1", true)}

                </p>

                <p className="text-xs text-emerald-400 font-semibold mt-0.5">

                  World #{prs?.sq1?.average?.world_rank ?? "—"}

                </p>

              </div>

            </div>

            <Link href="/content#sq1" className="inline-block text-sm font-bold text-cyan-400 hover:underline">

              Watch SQ1 Reconstructions →

            </Link>

          </aside>

        </div>

      </header>



      <PageSection className="!py-8 sm:!py-10">

        <StatStrip>

          <StatItem label="Competitions" value={wcaProfile?.competition_count ?? 0} detail="Official attended" />

          <StatItem

            label="Podiums"

            value={<span className="text-amber-400">{medals.total}</span>}

            detail={

              <span className="flex gap-3">

                <span>🥇 {medals.gold}</span>

                <span>🥈 {medals.silver}</span>

                <span>🥉 {medals.bronze}</span>

              </span>

            }

          />

          <StatItem

            label="Official Solves"

            value={(wcaProfile?.total_solves ?? 0).toLocaleString()}

            detail="Completed in comp"

          />

          <StatItem

            label="Continental Rec"

            value={wcaProfile?.records?.continental ?? 1}

            detail="North American record"

          />

        </StatStrip>

      </PageSection>



      <PageSection
        title="My Competitions"
        actions={

          <div className="flex flex-wrap gap-3 text-xs font-bold">

            {ongoingComps.length > 0 && (

              <span className="text-emerald-400">{ongoingComps.length} live</span>

            )}

            <span className="text-slate-500">{upcomingComps.length} upcoming</span>

          </div>

        }

      >

        {scheduledComps.length === 0 ? (

          <p className="text-sm text-slate-500">No ongoing or upcoming competitions on the WCA calendar.</p>

        ) : (

          <ul className="divide-y divide-slate-800/70">

            {scheduledComps.map((comp: any) => {

              const isLive = ongoingComps.some((c) => c.id === comp.id);

              const isDelegate = comp.delegates?.some((d: any) => d.wca_id === MY_WCA_ID);

              const isOrganizer = comp.organizers?.some((o: any) => o.wca_id === MY_WCA_ID);



              return (

                <li

                  key={comp.id}

                  className="py-5 sm:py-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8"

                >

                  <div className="flex-1 min-w-0 space-y-1.5">

                    <div className="flex flex-wrap items-center gap-2">

                      {isLive && (

                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">

                          Live Now

                        </span>

                      )}

                      {isDelegate && (

                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/70">

                          Delegate

                        </span>

                      )}

                      {isOrganizer && (

                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400/80">

                          Organizer

                        </span>

                      )}

                    </div>

                    <h3 className="text-base font-bold text-white leading-snug">{comp.name}</h3>

                    <p className="text-sm text-slate-400">{comp.city}</p>

                  </div>



                  <div className="flex flex-wrap items-center gap-1.5 sm:max-w-[180px]">

                    {comp.event_ids?.map((eventId: string) => (

                      <span

                        key={eventId}

                        title={EVENT_NAMES[eventId] || eventId}

                        className={`cubing-icon event-${eventId} text-base text-slate-400 hover:text-emerald-400 transition-colors`}

                      />

                    ))}

                  </div>



                  <div className="flex sm:flex-col sm:items-end gap-3 sm:gap-1 shrink-0 text-sm">

                    <span className="font-mono text-slate-500">{comp.date_range ?? comp.start_date}</span>

                    <a

                      href={comp.url}

                      target="_blank"

                      rel="noopener noreferrer"

                      className="font-bold text-emerald-400 hover:underline"

                    >

                      WCA →

                    </a>

                  </div>

                </li>

              );

            })}

          </ul>

        )}

      </PageSection>



      <PageSection title="Personal Records">

        <div className="overflow-x-auto -mx-4 sm:mx-0">

          <table className="w-full min-w-[540px] text-sm">

            <thead>

              <tr className="border-b border-slate-800 text-left">

                <th className="pb-3 pl-4 sm:pl-0 font-bold text-slate-500 text-[11px] uppercase tracking-wider">

                  Event

                </th>

                <th className="pb-3 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Single</th>

                <th className="pb-3 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Average</th>

                <th className="pb-3 pr-4 sm:pr-0 font-bold text-slate-500 text-[11px] uppercase tracking-wider text-right">

                  World Rank

                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-800/50">

              {sortedActivePrs.map(([eventId, eventData]: [string, any]) => {

                const { single, average } = eventData;

                const isSq1 = eventId === "sq1";

                const isMbf = eventId === "333mbf";



                return (

                  <tr key={eventId} className={isSq1 ? "bg-cyan-950/10" : ""}>

                    <td className="py-3.5 pl-4 sm:pl-0">

                      <div className="flex items-center gap-2">

                        <span

                          className={`cubing-icon event-${eventId} text-lg ${

                            isSq1 ? "text-cyan-400" : "text-slate-400"

                          }`}

                        />

                        <span className="font-semibold text-white">{EVENT_NAMES[eventId] || eventId}</span>

                        {isSq1 && (

                          <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider">Main</span>

                        )}

                      </div>

                    </td>

                    <td className="py-3.5 font-bold text-slate-200 tabular-nums">

                      {formatWcaResult(single?.best, eventId, false)}

                    </td>

                    <td className="py-3.5 font-bold text-slate-200 tabular-nums">

                      {isMbf ? "—" : formatWcaResult(average?.best, eventId, true)}

                    </td>

                    <td className="py-3.5 pr-4 sm:pr-0 text-right text-slate-500 tabular-nums">

                      {single?.world_rank ? `#${single.world_rank}` : "—"}

                      {!isMbf && average?.world_rank && (

                        <span className="text-slate-600"> / #{average.world_rank}</span>

                      )}

                    </td>

                  </tr>

                );

              })}

            </tbody>

          </table>

        </div>

      </PageSection>



      <PageSection title="Competition History Map">

        <div className="h-72 sm:h-96 w-full rounded-lg overflow-hidden ring-1 ring-slate-800">

          <MapWrapper comps={pastCompsForMap} />

        </div>

      </PageSection>



      <PnwCubingHub />

    </div>

  );

}

