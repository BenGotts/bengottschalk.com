import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import Link from "next/link";
import SectionHeader from "@/components/SectionHeader";
import WcaAvatar from "@/components/WcaAvatar";
import CubingStats from "@/components/cubing/CubingStats";
import CompetitionCard from "@/components/competitions/CompetitionCard";
import LiveCompetitionSummary from "@/components/competitions/LiveCompetitionSummary";
import VideoCard from "@/components/videos/VideoCard";
import { experience } from "@bengottschalk/content/experience";
import { SOCIAL_LINKS, WCA_PROFILE_URL } from "@bengottschalk/content/links";
import { SITE_URL } from "@/consts";
import {
  cubingStats,
  formatDelegateStatus,
  finishedCompetitions,
  getAvatar,
  getCompetitionHistory,
  getCompetitionsOverview,
  getDelegateRole,
  getPerson,
} from "@/lib/wca";
import { getLatestVideos } from "@/lib/youtube";
import ExternalLink from "@/components/ExternalLink";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Ben Gottschalk",
    description: "Ben Gottschalk: competitive Rubik's Cube solver, WCA Delegate for the Pacific Northwest, and software developer.",
    path: "/",
  }),
  // The home page uses the full name as its whole title, without the template.
  title: { absolute: "Ben Gottschalk · Competitive cuber and WCA Delegate" },
}

export default async function Home() {
  const [person, avatar, role, competitions, history, videos] = await Promise.all([
    getPerson(),
    getAvatar(),
    getDelegateRole(),
    getCompetitionsOverview(),
    getCompetitionHistory(),
    getLatestVideos(3),
  ]);

  const ongoing = competitions.ok ? competitions.data.ongoing : [];
  const nextUp = competitions.ok ? competitions.data.upcoming.slice(0, 2) : [];
  const currentJob = experience.find((job) => job.end === null);
  const stats = person.ok && history.ok
    ? cubingStats(person.data, finishedCompetitions(history.data.history, competitions.ok ? competitions.data : null, history.data.utcToday))
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
        {/* The photo sits beside the intro on wide screens and above it on phones. */}
        <div className="flex flex-col gap-8 lg:flex-row-reverse lg:items-center lg:justify-between lg:gap-12">
          {avatar.ok && avatar.data && <WcaAvatar avatar={avatar.data} alt="Ben Gottschalk" />}
          <div className="space-y-6">
            {role.ok && role.data && (
              <p className="text-sm font-semibold uppercase tracking-widest text-secondary">
                WCA {formatDelegateStatus(role.data.status)} · {role.data.region}
              </p>
            )}
            <h1 className="max-w-3xl text-5xl font-bold leading-tight sm:text-6xl">
              Competitive <span className="text-primary">cuber</span>, <span className="text-secondary">delegate</span>, and{" "}
              <span className="text-ink-orange">software developer</span>.
            </h1>
            <p className="max-w-2xl text-lg text-muted">
              I&apos;m Ben Gottschalk. I compete in and help run World Cube Association competitions across the
              Pacific Northwest, and I build software for a living.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/cubing" className="btn btn-primary">Cubing</Link>
              <Link href="/videos" className="btn btn-secondary">Latest videos</Link>
              <ExternalLink href={WCA_PROFILE_URL} className="btn border-base-300 bg-base-200 hover:border-primary" arrow iconClassName="-ml-1 size-[0.9em]">
                WCA profile
              </ExternalLink>
            </div>
          </div>
        </div>

        {stats && (
          <div className="pt-4">
            <CubingStats stats={stats} />
          </div>
        )}
      </section>

      {(ongoing.length > 0 || nextUp.length > 0) && (
        <section aria-labelledby="competitions-heading" className="space-y-4">
          <SectionHeader
            id="competitions-heading"
            title={ongoing.length > 0 ? "Happening now" : "Next up"}
            href="/cubing/competitions"
            linkLabel="All competitions"
          />
          {ongoing.length > 0 ? (
            <div className="space-y-4">
              {ongoing.map((competition) => (
                <LiveCompetitionSummary key={competition.id} competition={competition} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {nextUp.map((competition) => (
                <CompetitionCard key={competition.id} competition={competition} />
              ))}
            </div>
          )}
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
