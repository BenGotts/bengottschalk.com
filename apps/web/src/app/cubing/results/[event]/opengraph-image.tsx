import { ImageResponse } from "next/og";
import { OG_COLORS, OG_SIZE, StickerGrid, ogFonts } from "@/lib/og";
import { eventName, formatResult, getPerson, type Rank } from "@/lib/wca";

export const alt = "Ben Gottschalk's WCA personal records for this event";
export const size = OG_SIZE;
export const contentType = "image/png";

// Build one card per event page, like the page itself.
export { generateStaticParams } from "./page";

function PrBlock({ label, value, rank }: { label: string; value: string; rank: Rank }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        flex: 1,
        padding: 32,
        borderRadius: 24,
        background: OG_COLORS.card,
        border: `2px solid ${OG_COLORS.border}`,
      }}
    >
      <div style={{ fontSize: 28, color: OG_COLORS.muted }}>{label}</div>
      <div style={{ fontSize: 76, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 26, color: OG_COLORS.muted }}>
        {`NR ${rank.country_rank} · CR ${rank.continent_rank} · WR ${rank.world_rank}`}
      </div>
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ event: string }> }) {
  const { event } = await params;
  const person = await getPerson();
  const pr = person.ok ? person.data.personal_records[event] : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 72,
          background: OG_COLORS.background,
          color: OG_COLORS.text,
          fontFamily: "DM Sans",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <StickerGrid size={88} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 60, fontWeight: 700 }}>{eventName(event)}</div>
            <div style={{ fontSize: 30, color: OG_COLORS.muted }}>Ben Gottschalk · Personal records</div>
          </div>
        </div>
        {pr ? (
          <div style={{ display: "flex", gap: 32 }}>
            <PrBlock label="Single" value={formatResult(event, pr.single.best)} rank={pr.single} />
            {pr.average && <PrBlock label="Average" value={formatResult(event, pr.average.best, "average")} rank={pr.average} />}
          </div>
        ) : (
          <div style={{ fontSize: 40, color: OG_COLORS.muted }}>Official WCA results</div>
        )}
        <div style={{ fontSize: 28, color: OG_COLORS.secondary }}>bengottschalk.com/results</div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
