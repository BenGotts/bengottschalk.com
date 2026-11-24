import { SITE_URL } from "@bengottschalk/content/site";
import { TIMER_EVENTS } from "@bengottschalk/timer-core/events";
import { eventIconClass } from "@bengottschalk/wca/events";

const FEATURES = [
  "Every WCA event, with official scrambles",
  "Sessions you can branch for an ao100 and merge back",
  "Your WCA results alongside your practice solves",
  "Solve of the Day",
];

/** The public page while the timer is still being built (TIMER_PLACEHOLDER=1). */
export default function ComingSoon() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="timer-digits text-[clamp(3.5rem,16vw,6rem)] font-medium leading-none" aria-hidden>
        0.00
      </p>
      <h1 className="mt-6 text-3xl font-semibold">Cube Timer</h1>
      <p className="mt-2 text-lg text-muted">Coming soon</p>

      <ul className="mt-8 space-y-2 text-left">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex gap-3">
            <span className="mt-2 size-2 shrink-0 rounded-[2px] bg-secondary" aria-hidden />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap justify-center gap-3 text-2xl text-muted" aria-label="Events">
        {TIMER_EVENTS.map((event) => (
          <span key={event.id} className={eventIconClass(event.id)} title={event.name} />
        ))}
      </div>

      <a href={SITE_URL} className="btn btn-ghost btn-sm mt-10">bengottschalk.com</a>
    </main>
  );
}
