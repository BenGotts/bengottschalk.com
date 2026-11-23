import "@cubing/icons";
import type { IconType } from "react-icons";
import {
  LuActivity,
  LuAward,
  LuBadgeCheck,
  LuCalendarCheck,
  LuCalendarDays,
  LuCar,
  LuCheckCheck,
  LuCrown,
  LuFlag,
  LuFlame,
  LuGlobe,
  LuHourglass,
  LuMedal,
  LuPlane,
  LuTrophy,
  LuZap,
} from "react-icons/lu";
import { eventIconClass, eventName, type BadgeIcon, type BadgeTone, type EarnedBadge, type PodiumGoalRow } from "@/lib/wca";

const ICONS: Record<BadgeIcon, IconType> = {
  trophy: LuTrophy,
  "hat-trick": LuCrown,
  sweep: LuCheckCheck,
  haul: LuMedal,
  record: LuFlame,
  flag: LuFlag,
  globe: LuGlobe,
  calendar: LuCalendarCheck,
  medal: LuAward,
  marathon: LuActivity,
  busy: LuCalendarDays,
  plane: LuPlane,
  car: LuCar,
  decade: LuHourglass,
  bolt: LuZap,
  delegate: LuBadgeCheck,
};

// Full class names, so Tailwind finds them.
const TONE_EMBLEM: Record<BadgeTone, string> = {
  blue: "bg-primary/15 text-primary ring-primary/40",
  green: "bg-secondary/15 text-secondary ring-secondary/40",
  orange: "bg-ink-orange/15 text-ink-orange ring-ink-orange/40",
  yellow: "bg-ink-yellow/15 text-ink-yellow ring-ink-yellow/40",
  purple: "bg-ink-purple/15 text-ink-purple ring-ink-purple/40",
};

const PIPS = [
  ["gold", "bg-medal-gold"],
  ["silver", "bg-medal-silver"],
  ["bronze", "bg-medal-bronze"],
] as const;

// A pointy-top hexagon.
const HEX = "[clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]";

/**
 * A crest for an event with 1st, 2nd and 3rd: a gold-rimmed hexagon with the
 * event's icon and a pip for each medal. Retired events get a pewter rim.
 */
function Crest({ row, retired }: { row: PodiumGoalRow; retired: boolean }) {
  const name = eventName(row.eventId);
  const counts = row.cells.map((cell) => `${cell.count} ${cell.medal}`).join(", ");
  return (
    <li className="flex w-24 flex-col items-center gap-2 text-center" title={`${name}: ${counts}`}>
      <div
        className={`${HEX} p-[3px] ${
          retired ? "bg-[linear-gradient(160deg,#e3e7ec,#8e959f)]" : "bg-[linear-gradient(160deg,#f6dc8a,#c8922f_55%,#8a5a1c)]"
        }`}
      >
        <div className={`${HEX} flex h-[5.5rem] w-20 flex-col items-center justify-center gap-1.5 bg-[radial-gradient(ellipse_at_top,#24365c,#0b1324_75%)]`}>
          <span className={`${eventIconClass(row.eventId)} text-3xl text-white`} aria-hidden="true" />
          <span className="flex gap-1" aria-hidden="true">
            {PIPS.map(([medal, color]) => (
              <span key={medal} className={`size-2 rounded-full ring-1 ring-black/30 ${color}`} />
            ))}
          </span>
        </div>
      </div>
      <span className="text-xs font-semibold leading-tight">
        {name}
        {retired && <span className="block font-normal text-muted">retired</span>}
      </span>
      <span className="sr-only">{counts}</span>
    </li>
  );
}

/** One fun badge: a round emblem in its color, its name, and what earned it. */
function BadgeCard({ badge }: { badge: EarnedBadge }) {
  const Icon = ICONS[badge.icon];
  return (
    // Two to a row on phones, with the emblem above; side by side from `sm`.
    <li className="flex flex-col items-center gap-2 rounded-box border border-base-300 bg-base-200 p-3 text-center sm:flex-row sm:gap-3 sm:text-left">
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ring-2 ${TONE_EMBLEM[badge.tone]}`}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold leading-snug">{badge.name}</span>
        <span className="block text-xs leading-snug text-muted sm:text-sm">{badge.detail}</span>
      </span>
    </li>
  );
}

/**
 * The badges earned so far: a crest for each event with 1st, 2nd and 3rd
 * (triple crowns), then the fun badges.
 */
export default function BadgeCollection({ crowns, badges }: { crowns: { row: PodiumGoalRow; retired: boolean }[]; badges: EarnedBadge[] }) {
  return (
    <div className="space-y-8">
      {crowns.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold">Triple crowns</h3>
            <p className="text-sm text-muted">Events where I&apos;ve placed 1st, 2nd and 3rd.</p>
          </div>
          <ul className="flex flex-wrap justify-center gap-x-3 gap-y-5 sm:justify-start">
            {crowns.map(({ row, retired }) => <Crest key={row.eventId} row={row} retired={retired} />)}
          </ul>
        </div>
      )}
      {badges.length > 0 && (
        <ul aria-label="Badges" className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {badges.map((badge) => <BadgeCard key={badge.id} badge={badge} />)}
        </ul>
      )}
    </div>
  );
}
