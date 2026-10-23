import { SOCIAL_LINKS } from "@/content/links";

export default function Connect() {
  return (
    <section id="Connect" className="space-y-4 text-center">
      <h2 className="text-3xl font-bold">Connect With Me</h2>
      <p className="text-lg text-muted">Feel free to reach out or follow my work on these platforms:</p>
      <ul className="flex flex-wrap justify-center gap-3">
        {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
          <li key={href}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="btn h-auto flex-col gap-2 border-base-300 bg-base-200 px-5 py-4 hover:border-primary"
            >
              <Icon className="size-7" aria-hidden="true" />
              {label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
