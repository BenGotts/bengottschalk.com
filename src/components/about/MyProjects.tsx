import { FaGithub } from "react-icons/fa";
import { LuArrowUpRight } from "react-icons/lu";
import { formatDateSpan } from "@/content/dates";
import { projects } from "@/content/projects";

export default function MyProjects() {
  return (
    <section id="Projects" className="space-y-4">
      <h2 className="text-3xl font-bold">Projects</h2>
      {projects.map((project) => (
        <article key={project.title} className="card border border-base-300 bg-base-200">
          <div className="card-body gap-3 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-lg font-semibold">
                {project.projectLink ? (
                  <a
                    href={project.projectLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary inline-flex items-center gap-1"
                  >
                    {project.title} <LuArrowUpRight className="size-4" aria-hidden="true" />
                  </a>
                ) : (
                  project.title
                )}
              </h3>
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
            <a
              href={project.githubLink}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary inline-flex w-fit items-center gap-2 text-sm font-medium"
            >
              <FaGithub aria-hidden="true" /> Visit source code on GitHub
            </a>
          </div>
        </article>
      ))}
    </section>
  );
}
