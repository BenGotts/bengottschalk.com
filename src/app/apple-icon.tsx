import { ImageResponse } from "next/og";
import { StickerGrid } from "@/lib/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS adds its own rounded corners, so the grid sits on a full-bleed background.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "#0D0D0F" }}>
        <StickerGrid size={150} />
      </div>
    ),
    size,
  );
}
