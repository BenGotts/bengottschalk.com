import { getCompetitionsOverview } from "@/lib/wca";

/**
 * A pulsing red dot while I'm at a competition, for the header's Competitions
 * link (`inline`) or the phone menu button (`corner`). Renders nothing otherwise.
 */
export default async function LiveIndicator({ placement }: { placement: "inline" | "corner" }) {
  const overview = await getCompetitionsOverview();
  if (!overview.ok || overview.data.ongoing.length === 0) return null;
  return (
    <span className={placement === "corner" ? "absolute top-1.5 right-1.5 flex" : "ml-0.5 inline-flex"}>
      <span className="status status-error animate-pulse" aria-hidden="true" />
      <span className="sr-only">{placement === "corner" ? "A competition is happening now" : "(happening now)"}</span>
    </span>
  );
}
