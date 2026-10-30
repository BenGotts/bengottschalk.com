import Link from "next/link";
import { TONE_BORDER_HOVER, TONE_TEXT, type Tone } from "@/lib/tones";

interface StatTileProps {
  value: React.ReactNode;
  label: React.ReactNode;
  /** Makes the whole tile a link to the details behind the number. */
  href?: string;
  /** The cube color of the number (and the border on hover). */
  tone?: Tone;
}

export default function StatTile({ value, label, href, tone = "blue" }: StatTileProps) {
  const content = (
    <>
      <span className={`font-display text-4xl font-bold ${TONE_TEXT[tone]}`}>{value}</span>
      <span className="text-sm text-muted">{label}</span>
    </>
  );
  const className = "flex h-full flex-col gap-1.5 rounded-box border border-base-300 bg-base-200 p-5";
  if (!href) return <div className={className}>{content}</div>;
  return (
    <Link href={href} className={`${className} transition-colors ${TONE_BORDER_HOVER[tone]}`}>
      {content}
    </Link>
  );
}
