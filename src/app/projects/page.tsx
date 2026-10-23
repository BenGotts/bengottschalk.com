import type { Metadata } from "next";
import ProjectList from "@/components/projects/ProjectList";

export const metadata: Metadata = {
  title: "Projects | bengottschalk.com",
  description: "Software projects by Benjamin Gottschalk, many of them for the cubing community.",
}

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-4xl font-bold">Projects</h1>
        <p className="mt-2 text-lg text-muted">
          Things I&apos;ve built, from cubing tools to this website.{" "}
          <a href="https://github.com/BenGotts?tab=repositories" target="_blank" rel="noopener noreferrer" className="link link-primary">
            Everything is on GitHub
          </a>
          .
        </p>
      </header>
      <ProjectList />
    </div>
  )
}
