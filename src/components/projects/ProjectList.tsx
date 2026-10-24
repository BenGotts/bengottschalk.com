import { FaGithub } from "react-icons/fa";
import { formatDateSpan } from "@/content/dates";
import { projects } from "@/content/projects";
import ExternalLink from "@/components/ExternalLink";

export default function ProjectList() {
  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <article key={project.title} className="card border border-base-300 bg-base-200">
          <div className="card-body gap-3 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="text-lg font-semibold">
                {project.projectLink ? (
                  <ExternalLink href={project.projectLink} className="link link-primary" arrow>
                    {project.title}
                  </ExternalLink>
                ) : (
                  project.title
                )}
              </h2>
              <p className="text-sm text-muted">{formatDateSpan(project)}</p>
            </div>
            <ul className="flex flex-wrap gap-2" aria-label="Technologies">
              {project.technologies.split(", ").map((tech) => (
                <li key={tech} className="badge border-base-300 bg-base-100">{tech}</li>
              ))}
            </ul>
            <ul className="list-disc space-y-1 pl-5">
              {project.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            <ExternalLink href={project.githubLink} className="link link-primary inline-flex w-fit items-center gap-2 text-sm font-medium">
              <FaGithub aria-hidden="true" /> Visit source code on GitHub
            </ExternalLink>
          </div>
        </article>
      ))}
    </div>
  );
}
