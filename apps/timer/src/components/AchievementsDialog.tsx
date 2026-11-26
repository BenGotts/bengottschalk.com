"use client";

import { useState } from "react";
import { FaFire, FaLock, FaTrophy } from "react-icons/fa6";
import {
  ACHIEVEMENTS, BARRIERS, CATEGORY_NAMES, barrierId, barrierKinds, barrierLabel,
  type Achievement, type AchievementCategory, type AchievementReport, type BarrierKind,
} from "@bengottschalk/timer-core/achievements";
import { TIMER_EVENTS } from "@bengottschalk/timer-core/events";
import { eventIconClass } from "@bengottschalk/wca/events";
import { CELEBRATIONS, PHASE_COLORS, celebrationFor, isUnlocked, phaseColorsFor, unlockHint, type Reward } from "@/lib/rewards";
import { setGlobal, type StoredSettings } from "@/lib/settings";
import Modal from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  report: AchievementReport | null;
  earned: ReadonlySet<string>;
  sotdEnabled: boolean;
  stored: StoredSettings;
  onChange: (stored: StoredSettings) => void;
}

/** The categories listed as cards, in order (barriers and secrets have their own layouts). */
const CARD_CATEGORIES: AchievementCategory[] = ["practice", "streaks", "personal-bests", "consistency", "blind", "variety", "competition", "sotd"];

const KIND_LABELS: Record<BarrierKind, string> = {
  single: "Single",
  average: "Average",
  "competition-single": "Official single",
  "competition-average": "Official average",
};

type Tab = "earned" | "barriers" | "rewards";

const formatDate = (ms: number) => new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

export default function AchievementsDialog({ open, onClose, report, earned, sotdEnabled, stored, onChange }: Props) {
  const [tab, setTab] = useState<Tab>("earned");

  /** Whether an achievement applies to this person: barriers only for events they've done, SOTD only where it's on. */
  const applies = (a: Achievement): boolean => {
    if (a.category === "sotd") return sotdEnabled;
    if (a.category !== "barriers" || !report || !a.eventId) return true;
    return a.barrier?.startsWith("competition") ? report.eventsCompeted.has(a.eventId) : report.eventsPracticed.has(a.eventId);
  };
  const shown = ACHIEVEMENTS.filter(applies);
  const earnedCount = shown.filter((a) => earned.has(a.id)).length;

  return (
    <Modal open={open} onClose={onClose} title="Achievements" wide>
      {!report ? (
        <p className="text-muted">Counting your solves…</p>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Earned" value={`${earnedCount} / ${shown.length}`} icon={<FaTrophy className="text-ink-gold" aria-hidden />} />
            <Stat label="Current streak" value={`${report.currentStreak} ${report.currentStreak === 1 ? "day" : "days"}`} icon={<FaFire className={report.currentStreak > 0 ? "text-ink-orange" : "text-muted"} aria-hidden />} />
            <Stat label="Best streak" value={`${report.bestStreak} ${report.bestStreak === 1 ? "day" : "days"}`} />
          </div>

          <div role="tablist" className="tabs tabs-box tabs-sm">
            {(["earned", "barriers", "rewards"] as const).map((t) => (
              <button key={t} type="button" role="tab" className={`tab grow ${tab === t ? "tab-active" : ""}`} aria-selected={tab === t} onClick={() => setTab(t)}>
                {t === "earned" ? "Achievements" : t === "barriers" ? "Barriers" : "Rewards"}
              </button>
            ))}
          </div>

          {tab === "earned" && (
            <div className="space-y-5">
              {CARD_CATEGORIES.filter((c) => c !== "sotd" || sotdEnabled).map((category) => {
                const list = ACHIEVEMENTS.filter((a) => a.category === category);
                return (
                  <section key={category} className="space-y-2">
                    <h3 className="text-sm font-medium text-muted">
                      {CATEGORY_NAMES[category]} <span className="timer-digits">· {list.filter((a) => earned.has(a.id)).length}/{list.length}</span>
                    </h3>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {list.map((a) => <AchievementCard key={a.id} achievement={a} report={report} earned={earned.has(a.id)} />)}
                    </ul>
                  </section>
                );
              })}
              <section className="space-y-2">
                <h3 className="text-sm font-medium text-muted">{CATEGORY_NAMES.secret}</h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {ACHIEVEMENTS.filter((a) => a.category === "secret").map((a) => <AchievementCard key={a.id} achievement={a} report={report} earned={earned.has(a.id)} />)}
                </ul>
              </section>
            </div>
          )}

          {tab === "barriers" && <Barriers report={report} earned={earned} />}

          {tab === "rewards" && <Rewards earned={earned} stored={stored} onChange={onChange} />}
        </div>
      )}
    </Modal>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-box bg-base-200 px-2 py-3">
      <div className="timer-digits flex items-center justify-center gap-1.5 whitespace-nowrap text-base font-medium sm:text-lg">{icon}{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function AchievementCard({ achievement: a, report, earned }: { achievement: Achievement; report: AchievementReport; earned: boolean }) {
  const status = report.statuses.get(a.id);
  const hidden = a.secret && !earned;
  const progress = !earned && status?.progress ? status.progress : null;
  return (
    <li className={`flex items-start gap-3 rounded-box border px-3 py-2 ${earned ? "border-ink-gold/40 bg-base-200" : "border-base-300"}`}>
      <span className={`mt-0.5 shrink-0 ${earned ? "text-ink-gold" : "text-muted"}`}>{earned ? <FaTrophy aria-hidden /> : <FaLock aria-hidden />}</span>
      <div className="min-w-0 flex-1">
        <div className={`font-medium ${earned ? "" : "text-muted"}`}>{hidden ? "???" : a.title}</div>
        <div className="text-sm text-muted">{hidden ? "Keep solving to find this one." : a.description}</div>
        {earned && status?.earnedAt != null && <div className="text-xs text-muted">Earned {formatDate(status.earnedAt)}</div>}
        {progress && progress.current > 0 && (
          <div className="mt-1 flex items-center gap-2">
            <progress className="progress progress-primary h-1.5 flex-1" value={progress.current} max={progress.target} />
            <span className="timer-digits text-xs text-muted">{progress.current.toLocaleString("en-US")}/{progress.target.toLocaleString("en-US")}</span>
          </div>
        )}
      </div>
    </li>
  );
}

/** A ladder of barriers for each event done, single and average, and official ones for events competed in. */
function Barriers({ report, earned }: { report: AchievementReport; earned: ReadonlySet<string> }) {
  const events = TIMER_EVENTS.filter((e) => report.eventsPracticed.has(e.id) && BARRIERS[e.id]);
  if (events.length === 0) return <p className="text-sm text-muted">Do a solve to see the barriers for its event.</p>;
  return (
    <div className="space-y-4">
      {events.map((event) => (
        <section key={event.id} className="space-y-1.5">
          <h3 className="flex items-center gap-2 font-medium"><span className={eventIconClass(event.id)} aria-hidden /> {event.name}</h3>
          {barrierKinds(event.id).filter((kind) => !kind.startsWith("competition") || report.eventsCompeted.has(event.id)).map((kind) => {
            const thresholds = BARRIERS[event.id];
            // The first barrier not yet broken: the next goal.
            const next = thresholds.find((t) => !earned.has(barrierId(event.id, kind, t)));
            return (
              <div key={kind} className="flex flex-wrap items-center gap-1.5">
                <span className="w-28 shrink-0 text-xs text-muted">{KIND_LABELS[kind]}</span>
                {thresholds.map((t) => {
                  const id = barrierId(event.id, kind, t);
                  const done = earned.has(id);
                  const at = report.statuses.get(id)?.earnedAt;
                  return (
                    <span
                      key={t}
                      className={`badge badge-sm timer-digits ${done ? "badge-success badge-soft" : t === next ? "badge-primary badge-outline" : "badge-ghost text-muted"}`}
                      title={done && at != null ? `Broken ${formatDate(at)}` : t === next ? "Next goal" : undefined}
                    >
                      {barrierLabel(event.id, t)}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}

/** The looks achievements unlock, chosen here or in Settings. */
export function Rewards({ earned, stored, onChange }: { earned: ReadonlySet<string>; stored: StoredSettings; onChange: (stored: StoredSettings) => void }) {
  const colors = phaseColorsFor(stored.global.phaseColors, earned);
  const celebration = celebrationFor(stored.global.celebration, earned);
  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-muted">Timer colors</h3>
        <p className="text-xs text-muted">The time while you hold, when it’s ready to start, and during inspection.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {PHASE_COLORS.map((preset) => (
            <RewardButton key={preset.id} reward={preset} earned={earned} selected={colors.id === preset.id} onSelect={() => onChange(setGlobal(stored, "phaseColors", preset.id))}>
              <span className="timer-digits flex gap-2 text-lg font-medium" aria-hidden>
                <span className={preset.holding}>0.00</span><span className={preset.ready}>0.00</span><span className={preset.inspecting}>15</span>
              </span>
            </RewardButton>
          ))}
        </div>
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-muted">New best single</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {CELEBRATIONS.map((c) => (
            <RewardButton key={c.id} reward={c} earned={earned} selected={celebration.id === c.id} onSelect={() => onChange(setGlobal(stored, "celebration", c.id))} />
          ))}
        </div>
      </section>
    </div>
  );
}

function RewardButton({ reward, earned, selected, onSelect, children }: { reward: Reward; earned: ReadonlySet<string>; selected: boolean; onSelect: () => void; children?: React.ReactNode }) {
  const unlocked = isUnlocked(reward, earned);
  const hint = unlockHint(reward);
  return (
    <button
      type="button"
      className={`flex items-center justify-between gap-3 rounded-box border px-3 py-2 text-left ${selected ? "border-primary bg-primary/10" : "border-base-300"} ${unlocked ? "" : "cursor-not-allowed opacity-60"}`}
      onClick={unlocked ? onSelect : undefined}
      aria-pressed={selected}
      aria-disabled={!unlocked}
      title={unlocked ? undefined : hint ?? undefined}
    >
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 font-medium">{!unlocked && <FaLock className="size-3" aria-hidden />}{reward.name}</span>
        {!unlocked && hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      {children}
    </button>
  );
}
