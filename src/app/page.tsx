import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import Link from "next/link";
import { LuArrowRight, LuArrowUpRight } from "react-icons/lu";
import StatTile from "@/components/StatTile";
import CompetitionCard from "@/components/competitions/CompetitionCard";
import CompetitionSchedule from "@/components/competitions/CompetitionSchedule";
import VideoCard from "@/components/videos/VideoCard";
import { experience } from "@/content/experience";
import { SOCIAL_LINKS, WCA_PROFILE_URL } from "@/content/links";
import { SITE_URL } from "@/consts";
import {
  formatDelegateStatus,
  finishedCompetitions,
  getCompetitionHistory,
  getCompetitionsOverview,
  getDelegateRole,
  getPerson,
  historyStats,
} from "@/lib/wca";
import { getLatestVideos } from "@/lib/youtube";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Ben Gottschalk",
    description: "Ben Gottschalk: competitive Rubik's Cube solver, WCA Delegate for the Pacific Northwest, and software developer.",
    path: "/",
  }),
  // The home page uses the full name as its whole title, without the template.
  title: { absolute: "Ben Gottschalk · Competitive cuber and WCA Delegate" },
}

function SectionHeader({ id, title, href, linkLabel }: { id: string; title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 id={id} className="text-2xl font-bold">{title}</h2>
      <Link href={href} className="link link-primary inline-flex items-center gap-1 text-sm font-medium">
        {linkLabel} <LuArrowRight aria-hidden="true" />
      </Link>
    </div>
  );
}

export default async function Home() {
  const [person, role, competitions, history, videos] = await Promise.all([
    getPerson(),
    getDelegateRole(),
    getCompetitionsOverview(),
    getCompetitionHistory(),
    getLatestVideos(3),
  ]);

  const ongoing = competitions.ok ? competitions.data.ongoing : [];
  const nextUp = competitions.ok ? competitions.data.upcoming.slice(0, 2) : [];
  const currentJob = experience.find((job) => job.end === null);
  const delegatedCount = history.ok
    ? historyStats(finishedCompetitions(history.data.history, competitions.ok ? competitions.data : null, history.data.utcToday)).delegated
    : null;

  // schema.org Person, so search engines can connect the site to these profiles.
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Benjamin Gottschalk",
    alternateName: "Ben Gottschalk",
    url: SITE_URL,
    ...(currentJob && {
      jobTitle: currentJob.title,
      worksFor: { "@type": "Organization", name: currentJob.company },
    }),
    sameAs: [WCA_PROFILE_URL, ...SOCIAL_LINKS.map((link) => link.href)],
  };

  return (
    <div className="space-y-16">
      <script
        type="application/ld+json"
        // Escape "<" so the JSON can never close the script tag early.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c") }}
      />
      <section className="space-y-6 pt-4">
        {role.ok && role.data && (
          <p className="text-sm font-semibold uppercase tracking-widest text-secondary">
            WCA {formatDelegateStatus(role.data.status)} · {role.data.region}
          </p>
        )}
        <h1 className="max-w-3xl text-5xl font-bold leading-tight sm:text-6xl">
          Competitive cuber, delegate, and software developer.
        </h1>
        <p className="max-w-2xl text-lg text-muted">
          I&apos;m Ben Gottschalk. I compete in and help run World Cube Association competitions across the
          Pacific Northwest, and I build software for a living.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/competitions" className="btn btn-primary">Upcoming competitions</Link>
          <Link href="/videos" className="btn btn-secondary">Latest videos</Link>
          <a
            href={WCA_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn border-base-300 bg-base-200 hover:border-primary"
          >
            WCA profile <LuArrowUpRight aria-hidden="true" />
          </a>
        </div>

        {person.ok && (
          <div className="grid grid-cols-2 gap-4 pt-4 lg:grid-cols-4">
            <StatTile value={person.data.competition_count} label="Competitions" />
            {delegatedCount !== null && <StatTile value={delegatedCount} label="Delegated" />}
            <StatTile
              value={person.data.medals.total}
              label={
                <span className="flex flex-wrap gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-medal-gold" aria-hidden="true" />{person.data.medals.gold} gold</span>
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-medal-silver" aria-hidden="true" />{person.data.medals.silver} silver</span>
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-medal-bronze" aria-hidden="true" />{person.data.medals.bronze} bronze</span>
                </span>
              }
            />
            <StatTile
              value={person.data.records.total}
              label={person.data.records.total === 1 ? "Regional record" : "Regional records"}
            />
          </div>
        )}
      </section>

      {(ongoing.length > 0 || nextUp.length > 0) && (
        <section aria-labelledby="competitions-heading" className="space-y-4">
          <SectionHeader
            id="competitions-heading"
            title={ongoing.length > 0 ? "Happening now" : "Next up"}
            href="/competitions"
            linkLabel="All competitions"
          />
          <div className="grid gap-4 md:grid-cols-2">
            {ongoing.map((competition) => (
              <CompetitionCard key={competition.id} competition={competition} isOngoing />
            ))}
            {ongoing.length === 0 && nextUp.map((competition) => (
              <CompetitionCard key={competition.id} competition={competition} />
            ))}
          </div>
          {ongoing.map((competition) => (
            <CompetitionSchedule key={competition.id} competitionId={competition.id} competitionName={competition.name} />
          ))}
        </section>
      )}

      {videos.ok && videos.data.length > 0 && (
        <section aria-labelledby="videos-heading" className="space-y-4">
          <SectionHeader id="videos-heading" title="Latest videos" href="/videos" linkLabel="All videos" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {videos.data.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="software-heading" className="rounded-box border border-base-300 bg-base-200 p-6 sm:p-8">
        <h2 id="software-heading" className="text-2xl font-bold">Software</h2>
        <p className="mt-3 max-w-2xl text-lg">
          {currentJob ? <>I&apos;m a {currentJob.title} at {currentJob.company}. </> : null}
          I also build side projects, many of them for the cubing community, including this site, which pulls its
          data straight from the WCA API.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/projects" className="btn btn-primary">Projects</Link>
          <Link href="/about" className="btn border-base-300 bg-base-100 hover:border-primary">About me</Link>
        </div>
      </section>
    </div>
  );
}
