import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import ContactForm from "@/components/forms/ContactForm";
import ExternalLink from "@/components/ExternalLink";
import { SOCIAL_LINKS, WCA_PROFILE_URL } from "@bengottschalk/content/links";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: "Get in touch with Ben Gottschalk about WCA competitions, cubing, or software.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    // Phones: intro, form, then links. From lg up the form sits on the right of both.
    <div className="grid gap-10 lg:grid-cols-[2fr_3fr] lg:gap-14">
      <header className="space-y-5 lg:pt-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-secondary">Contact</p>
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
          Let&apos;s talk <span className="text-primary">cubing</span>, <span className="text-secondary">competitions</span>, or{" "}
          <span className="text-ink-orange">code</span>.
        </h1>
        <p className="text-lg text-muted">
          Questions about a competition in the Pacific Northwest, a video, a project, or working together: send a message and
          I&apos;ll get back to you, usually within a few days.
        </p>
      </header>

      <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <ContactForm />
      </div>

      <section aria-labelledby="elsewhere-heading" className="space-y-3">
        <h2 id="elsewhere-heading" className="text-sm font-semibold uppercase tracking-wider text-muted">Elsewhere</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
          <li>
            <ExternalLink href={WCA_PROFILE_URL} className="flex items-center gap-2.5 rounded-field border border-base-300 bg-base-200 px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary">
              <span className="cubing-icon event-333 text-base text-primary" aria-hidden="true" />
              WCA profile
            </ExternalLink>
          </li>
          {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
            <li key={href}>
              <ExternalLink href={href} className="flex items-center gap-2.5 rounded-field border border-base-300 bg-base-200 px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary">
                <Icon className="size-4 text-muted" aria-hidden="true" />
                {label}
              </ExternalLink>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
