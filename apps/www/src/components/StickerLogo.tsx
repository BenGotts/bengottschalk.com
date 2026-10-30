// A 3×3 cube face. Colors match src/app/icon.svg.
const STICKERS = [
  "#0051BA", "#F4F4F4", "#009E60",
  "#C41E3A", "#FFD500", "#FF5800",
  "#009E60", "#0051BA", "#F4F4F4",
];

export default function StickerLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 30 30" aria-hidden="true">
      <rect width="30" height="30" rx="7" fill="#0D0D0F" />
      {STICKERS.map((color, i) => (
        <rect
          key={i}
          x={3 + (i % 3) * 8.5}
          y={3 + Math.floor(i / 3) * 8.5}
          width="7"
          height="7"
          rx="1.5"
          fill={color}
        />
      ))}
    </svg>
  );
}
