import { formatDateSpan } from "@/content/dates";
import { experience } from "@/content/experience";

export default function Experience() {
  return (
    <section id="Experience" className="space-y-4">
      <h2 className="text-3xl font-bold">Experience</h2>
      {experience.map((job) => (
        <article key={`${job.company}-${job.start}`} className="card border border-base-300 bg-base-200">
          <div className="card-body gap-2 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-lg font-semibold">
                {job.title}
                <span className="font-sans font-normal text-muted"> · {job.company}</span>
              </h3>
              <p className="text-sm text-muted">{formatDateSpan(job)}</p>
            </div>
            {job.details.length > 0 && (
              <ul className="list-disc space-y-1 pl-5">
                {job.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        </article>
      ))}
    </section>
  )
}
