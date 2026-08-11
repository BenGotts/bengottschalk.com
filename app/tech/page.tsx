import type { Metadata } from "next";
import Link from "next/link";
import { PageSection } from "@/components/layout/PageSection";
import {
  PERSONAL_BUILDS,
  TECH_EDUCATION,
  TECH_EXPERIENCE,
  TECH_PROFILE,
  TECH_SKILL_GROUPS,
} from "@/lib/tech-content";

export const metadata: Metadata = {
  title: "Tech | Ben Gottschalk",
  description:
    "Software engineering background, experience, and personal projects by Ben Gottschalk.",
};

export default function TechPage() {
  return (
    <div className="-mt-2">
      <header className="relative pb-10 sm:pb-12 border-b border-slate-800/70">
        <div className="absolute inset-0 -mx-4 sm:-mx-6 bg-gradient-to-b from-sky-950/25 via-transparent to-transparent pointer-events-none" />
        <div className="relative space-y-5 max-w-3xl">
          <p className="text-xs font-semibold text-sky-400">{TECH_PROFILE.headline}</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-[1.1]">
            Background
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            {TECH_PROFILE.summary}
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
            {TECH_PROFILE.links.map(({ label, href, external }) =>
              external ? (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-sky-400 hover:underline"
                >
                  {label} ↗
                </a>
              ) : (
                <Link key={href} href={href} className="text-sm font-bold text-sky-400 hover:underline">
                  {label} →
                </Link>
              ),
            )}
          </div>
        </div>
      </header>

      <PageSection title="Experience">
        <div className="space-y-10 sm:space-y-12">
          {TECH_EXPERIENCE.map((role) => (
            <article key={`${role.company}-${role.dates}`} className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">
              <div className="lg:col-span-4 space-y-1 border-l-2 border-sky-500/40 pl-5">
                <h2 className="text-lg font-black text-white">{role.company}</h2>
                <p className="text-sm font-semibold text-slate-300">{role.title}</p>
                <p className="text-xs font-mono text-slate-500">{role.dates}</p>
              </div>
              <ul className="lg:col-span-8 space-y-2">
                {role.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-2 text-sm text-slate-400 leading-relaxed">
                    <span className="text-sky-400 shrink-0">·</span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </PageSection>

      <PageSection title="Education">
        <article className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">
          <div className="lg:col-span-4 space-y-1 border-l-2 border-sky-500/40 pl-5">
            <h2 className="text-lg font-black text-white">{TECH_EDUCATION.school}</h2>
            <p className="text-sm font-semibold text-slate-300">{TECH_EDUCATION.degree}</p>
            <p className="text-sm text-slate-400">Minor in {TECH_EDUCATION.minor}</p>
            <p className="text-xs font-mono text-slate-500">{TECH_EDUCATION.dates}</p>
          </div>
          <p className="lg:col-span-8 text-sm text-slate-400 leading-relaxed self-center">
            {TECH_EDUCATION.detail}
          </p>
        </article>
      </PageSection>

      <PageSection title="Skills">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {TECH_SKILL_GROUPS.map(({ label, skills }) => (
            <div key={label} className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {label}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">{skills.join(" · ")}</p>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection title="Personal builds">
        <p className="text-sm text-slate-400 mb-8 max-w-2xl">
          Side projects and community tooling I work on outside of my day job — mostly cubing-related.
        </p>
        <ul className="divide-y divide-slate-800/70">
          {PERSONAL_BUILDS.map((project) => (
            <li key={project.title} className="py-6 sm:py-7 first:pt-0 last:pb-0">
              <article className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                <div className="space-y-2 min-w-0 flex-1">
                  <h3 className="text-base font-black text-white">{project.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                    {project.description}
                  </p>
                  <p className="text-xs text-slate-500">{project.tags.join(" · ")}</p>
                </div>
                {project.links && (
                  <div className="flex flex-wrap gap-x-4 shrink-0">
                    {project.links.map(({ label, href, external }) =>
                      external ? (
                        <a
                          key={href}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-sky-400 hover:underline"
                        >
                          {label} ↗
                        </a>
                      ) : (
                        <Link key={href} href={href} className="text-sm font-bold text-sky-400 hover:underline">
                          {label} →
                        </Link>
                      ),
                    )}
                  </div>
                )}
              </article>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection title="Side projects">
        <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
          Not looking for full-time work, but open to the occasional interesting side gig — especially
          cubing tools, community platforms, or small web apps.{" "}
          <Link href="/contact?topic=tech" className="text-sky-400 font-bold hover:underline">
            Say hello
          </Link>
          .
        </p>
      </PageSection>
    </div>
  );
}
