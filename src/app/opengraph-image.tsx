import { ImageResponse } from "next/og";
import { OG_COLORS, OG_SIZE, StickerGrid, ogFonts } from "@/lib/og";

export const alt = "Ben Gottschalk: competitive cuber, WCA Delegate, and software developer";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 80,
          background: OG_COLORS.background,
          color: OG_COLORS.text,
          fontFamily: "DM Sans",
        }}
      >
        <StickerGrid size={120} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -2 }}>Ben Gottschalk</div>
          <div style={{ fontSize: 38, color: OG_COLORS.muted }}>Competitive cuber · WCA Delegate · Software developer</div>
        </div>
        <div style={{ fontSize: 30, color: OG_COLORS.secondary }}>bengottschalk.com</div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
