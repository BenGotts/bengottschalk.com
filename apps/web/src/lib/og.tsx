// Building blocks for generated images (next/og). Satori only understands
// inline styles and flexbox, so these don't use Tailwind or theme variables.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife } from "next/cache";

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * DM Sans for generated images. Satori can't read the woff2 files next/font
 * uses, so woff copies (from @fontsource/dm-sans, OFL) live in src/assets/fonts.
 * Cached because uncached file reads would make the image routes dynamic.
 */
export async function ogFonts() {
  "use cache";
  cacheLife("max");
  const dir = join(process.cwd(), "src/assets/fonts");
  // Exact ArrayBuffer copies: a Buffer comes back from the cache as a byte view,
  // but Satori needs a plain ArrayBuffer.
  const load = async (file: string) => {
    const bytes = await readFile(join(dir, file));
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  };
  const [regular, bold] = await Promise.all([load("DMSans-Regular.woff"), load("DMSans-Bold.woff")]);
  return [
    { name: "DM Sans", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "DM Sans", data: bold, weight: 700 as const, style: "normal" as const },
  ];
}

// Midnight Cube, dark theme.
export const OG_COLORS = {
  background: "#0B1220",
  card: "#111A2E",
  border: "#1A2540",
  text: "#E6EBF5",
  muted: "#9AA6BF",
  primary: "#4C8DFF",
  secondary: "#2FBF71",
};

// Same face as src/components/StickerLogo.tsx.
const STICKERS = [
  ["#0051BA", "#F4F4F4", "#009E60"],
  ["#C41E3A", "#FFD500", "#FF5800"],
  ["#009E60", "#0051BA", "#F4F4F4"],
];

export function StickerGrid({ size }: { size: number }) {
  const gap = size * 0.05;
  const padding = size * 0.1;
  const sticker = (size - padding * 2 - gap * 2) / 3;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap,
        width: size,
        height: size,
        padding,
        background: "#0D0D0F",
        borderRadius: size * 0.23,
      }}
    >
      {STICKERS.map((row, r) => (
        <div key={r} style={{ display: "flex", gap }}>
          {row.map((color, c) => (
            <div key={c} style={{ width: sticker, height: sticker, background: color, borderRadius: sticker * 0.2 }} />
          ))}
        </div>
      ))}
    </div>
  );
}
