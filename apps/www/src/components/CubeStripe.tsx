// A strip of cube stickers, mostly the site's blue and green.
const STICKERS = [
  { color: "bg-cube-blue", grow: "flex-[4]" },
  { color: "bg-cube-red", grow: "flex-1" },
  { color: "bg-cube-yellow", grow: "flex-1" },
  { color: "bg-cube-green", grow: "flex-[4]" },
  { color: "bg-cube-orange", grow: "flex-1" },
];

export default function CubeStripe({ className = "" }: { className?: string }) {
  return (
    <div className={`flex h-1 ${className}`} aria-hidden="true">
      {STICKERS.map(({ color, grow }) => <span key={color} className={`${color} ${grow}`} />)}
    </div>
  );
}
