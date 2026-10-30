import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import ProjectList from "@/components/projects/ProjectList";
import ExternalLink from "@/components/ExternalLink";

export const metadata: Metadata = pageMetadata({
  title: "Projects",
  description: "Software projects by Ben Gottschalk, many of them for the cubing community.",
  path: "/projects",
});

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-4xl font-bold">Projects</h1>
        <p className="mt-2 text-lg text-muted">
          Things I&apos;ve built, from cubing tools to this website.{" "}
          <ExternalLink href="https://github.com/BenGotts?tab=repositories" className="link link-primary">
            Everything is on GitHub
          </ExternalLink>
          .
        </p>
      </header>
      <ProjectList />
    </div>
  )
}
