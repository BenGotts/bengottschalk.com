"use client";

import { useState } from "react";
import { FaArrowRotateLeft } from "react-icons/fa6";
import { timerEvent } from "@bengottschalk/timer-core/events";
import { localDate } from "@bengottschalk/timer-core/zone";
import { COLOR_FAMILIES, colorFamilyFor, type ColorFamily, type ColorScheme } from "@/lib/colorSchemes";
import { exportBackup, importBackup } from "@/lib/db";
import {
  eventOverrides, resetEvent, setEventColors, setFamilyColors, setForEvent, setGlobal, settingsForEvent,
  type EventSettingKey, type Settings, type StoredSettings,
} from "@/lib/settings";
import { AccountSettings } from "./Account";
import Modal from "./Modal";
import ScrambleImage from "./ScrambleImage";
import ThemeToggle from "./ThemeToggle";

interface Props {
  open: boolean;
  onClose: () => void;
  stored: StoredSettings;
  /** The event on screen, whose own settings "This event" changes. */
  eventId: string;
  onChange: (stored: StoredSettings) => void;
  onImportCsTimer: () => void;
  /** Whether signing in with WCA is set up on this server. */
  authEnabled: boolean;
}

/** Saves everything on this device as a JSON file. */
async function download() {
  const blob = new Blob([await exportBackup()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cube-timer-backup-${localDate(Date.now())}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

const isEntry = (value: string): value is Settings["entry"] => value === "timer" || value === "typing";
const isPrecision = (value: string): value is Settings["precision"] => value === "hundredths" || value === "thousandths";

type Scope = "all" | "event";

/**
 * Settings for all events, or for the event on screen. In "This event", each
 * setting an event can have for itself shows whether it's the event's own
 * value (with a reset back to the one for all events) or the shared one.
 */
export default function SettingsDialog({ open, onClose, stored, eventId, onChange, onImportCsTimer, authEnabled }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>("all");
  const event = timerEvent(eventId);
  const eventOwnCount = Object.keys(stored.events[eventId] ?? {}).length;
  // What the controls show: the global values, or the ones in effect for this event.
  const shown: Settings = scope === "all" ? stored.global : settingsForEvent(stored, eventId);

  /** Changes a setting an event can have for itself, at the current scope. */
  const setPerEvent = <K extends EventSettingKey>(key: K, value: Settings[K]) =>
    onChange(scope === "all" ? setGlobal(stored, key, value) : setForEvent(stored, eventId, key, value));
  const setGlobalOnly = <K extends keyof Settings>(key: K, value: Settings[K]) => onChange(setGlobal(stored, key, value));
  /** In "This event": whether the event has its own value, and a way to drop it. */
  const own = (key: EventSettingKey) =>
    scope === "event" ? { own: eventOverrides(stored, eventId, key), reset: () => onChange(setForEvent(stored, eventId, key, undefined)) } : null;

  const restore = async (file: File | undefined) => {
    if (!file) return;
    try {
      const result = await importBackup(await file.text());
      setMessage(`Restored ${result.solves} solves and ${result.sessions} sessions.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Couldn't read that backup.");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="space-y-5">
        <fieldset className="join w-full">
          <legend className="sr-only">Which settings</legend>
          <button type="button" className={`btn join-item btn-sm grow ${scope === "all" ? "btn-primary" : ""}`} aria-pressed={scope === "all"} onClick={() => setScope("all")}>
            All events
          </button>
          <button type="button" className={`btn join-item btn-sm grow ${scope === "event" ? "btn-primary" : ""}`} aria-pressed={scope === "event"} onClick={() => setScope("event")}>
            {event.name} only{eventOwnCount > 0 && <span className="badge badge-xs badge-accent">{eventOwnCount}</span>}
          </button>
        </fieldset>
        {scope === "event" && (
          <div className="flex items-start justify-between gap-3 text-xs text-muted">
            <p>Changes here apply to {event.name} only. Settings marked “all events” follow the settings for all events.</p>
            {eventOwnCount > 0 && (
              <button type="button" className="btn btn-ghost btn-xs shrink-0" onClick={() => onChange(resetEvent(stored, eventId))}>
                <FaArrowRotateLeft aria-hidden /> Reset all
              </button>
            )}
          </div>
        )}

        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted">Timing</h3>
          {(scope === "all" || event.inspection) && (
            <Toggle label="WCA inspection (15 seconds)" checked={shown.inspection} onChange={(v) => setPerEvent("inspection", v)} own={own("inspection")} />
          )}
          {scope === "all" && (
            <Toggle label="Say “8 seconds” and “12 seconds”" checked={shown.inspectionVoice} onChange={(v) => setGlobalOnly("inspectionVoice", v)} disabled={!shown.inspection} />
          )}
          <Toggle label="Hide the time while solving" checked={shown.hideRunningTime} onChange={(v) => setPerEvent("hideRunningTime", v)} own={own("hideRunningTime")} />
          {(scope === "all" || event.blindfolded) && (
            <Toggle label="Blindfolded: split memo with the first press" checked={shown.bldMemoSplit} onChange={(v) => setPerEvent("bldMemoSplit", v)} own={own("bldMemoSplit")} />
          )}
          <Row label="Hold before starting" own={own("holdMs")}>
            <select className="select select-sm w-32" value={shown.holdMs} onChange={(e) => setPerEvent("holdMs", Number(e.target.value))}>
              {[0, 100, 300, 550, 1000].map((ms) => <option key={ms} value={ms}>{ms === 0 ? "No hold" : `${ms / 1000} s`}</option>)}
            </select>
          </Row>
          <Row label="Enter times" own={own("entry")}>
            <select className="select select-sm w-32" value={shown.entry} onChange={(e) => isEntry(e.target.value) && setPerEvent("entry", e.target.value)}>
              <option value="timer">With the timer</option>
              <option value="typing">By typing</option>
            </select>
          </Row>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted">Display</h3>
          {scope === "all" && (
            <>
              <Row label="Show times to the">
                <select className="select select-sm w-32" value={shown.precision} onChange={(e) => isPrecision(e.target.value) && setGlobalOnly("precision", e.target.value)}>
                  <option value="hundredths">Hundredth</option>
                  <option value="thousandths">Thousandth</option>
                </select>
              </Row>
              <p className="text-xs text-muted">Times are always saved to the thousandth. Singles are cut off and averages rounded, the way the WCA shows them.</p>
            </>
          )}
          <Toggle label="Scramble picture" checked={shown.showScrambleImage} onChange={(v) => setPerEvent("showScrambleImage", v)} own={own("showScrambleImage")} />
          {scope === "all" && <div className="flex items-center justify-between gap-4"><span>Theme</span><ThemeToggle /></div>}
        </section>

        <ColorSettings stored={stored} eventId={eventId} scope={scope} onChange={onChange} />

        {scope === "all" && (
          <section className="space-y-2">
            <h3 className="text-sm font-medium text-muted">Your data</h3>
            <p className="text-xs text-muted">Solves are saved in this browser, so the timer works offline.</p>
            {authEnabled && <AccountSettings />}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-sm" onClick={() => { onClose(); onImportCsTimer(); }}>Import from csTimer</button>
              <button type="button" className="btn btn-sm" onClick={() => void download()}>Download a backup</button>
              <label className="btn btn-sm">
                Restore a backup
                <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => void restore(e.target.files?.[0])} />
              </label>
            </div>
            {message && <output className="block text-sm">{message}</output>}
          </section>
        )}
      </div>
    </Modal>
  );
}

/**
 * Scramble picture colors. For all events: pick a puzzle family and set its
 * colors. For one event: that event's family, as the event's own colors.
 */
function ColorSettings({ stored, eventId, scope, onChange }: { stored: StoredSettings; eventId: string; scope: Scope; onChange: (stored: StoredSettings) => void }) {
  const event = timerEvent(eventId);
  const eventFamily = colorFamilyFor(event.puzzleId);
  const [pickedFamily, setPickedFamily] = useState<string>(eventFamily?.id ?? "cube");
  const family: ColorFamily | null = scope === "all" ? COLOR_FAMILIES.find((f) => f.id === pickedFamily) ?? null : eventFamily;

  if (!family) {
    return (
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-muted">Scramble colors</h3>
        <p className="text-xs text-muted">{event.name}’s scramble picture can’t change colors.</p>
      </section>
    );
  }

  const familyColors = stored.global.colors[family.id] ?? {};
  const eventColors = stored.events[eventId]?.colors;
  const ownColors = scope === "event" && eventColors !== undefined;
  // The colors in effect at this scope.
  const scheme: ColorScheme = scope === "all" ? familyColors : { ...familyColors, ...eventColors };
  const save = (next: ColorScheme) => onChange(scope === "all" ? setFamilyColors(stored, family.id, next) : setEventColors(stored, eventId, next));
  /** A preset as a full set of colors, so for one event it holds even if the colors for all events change. */
  const fullPreset = (colors: ColorScheme): ColorScheme => Object.fromEntries(family.faces.map((face) => [face.key, colors[face.key] ?? face.color]));
  const matches = (colors: ColorScheme) => family.faces.every((face) => (scheme[face.key] ?? face.color).toLowerCase() === (colors[face.key] ?? face.color).toLowerCase());

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-muted">Scramble colors</h3>
        {scope === "all" ? (
          <select className="select select-sm w-44" value={family.id} onChange={(e) => setPickedFamily(e.target.value)} aria-label="Puzzle">
            {COLOR_FAMILIES.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        ) : (
          <OwnMarker own={ownColors} reset={() => onChange(setEventColors(stored, eventId, undefined))} />
        )}
      </div>
      <div className="h-32 w-full rounded-field bg-base-200 p-2">
        <ScrambleImage puzzleId={scope === "event" && event.puzzleId ? event.puzzleId : family.previewPuzzle} scramble="" scheme={scheme} />
      </div>
      <div className="flex flex-wrap gap-2">
        {family.presets.map((preset) => (
          <button
            key={preset.name}
            type="button"
            className={`btn btn-xs ${matches(preset.colors) ? "btn-primary" : ""}`}
            onClick={() => save(scope === "all" ? preset.colors : fullPreset(preset.colors))}
          >
            {preset.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {family.faces.map((face) => (
          <label key={face.key} className="flex items-center gap-2 text-sm">
            <input
              type="color"
              className="h-7 w-9 shrink-0 cursor-pointer rounded border border-base-300 bg-transparent"
              value={normalizeHex(scheme[face.key] ?? face.color)}
              onChange={(e) => save({ ...(scope === "all" ? familyColors : eventColors), [face.key]: e.target.value })}
            />
            <span className="truncate">{face.label}</span>
          </label>
        ))}
      </div>
      {scope === "all" && Object.keys(familyColors).length > 0 && (
        <button type="button" className="btn btn-ghost btn-xs" onClick={() => save({})}>
          <FaArrowRotateLeft aria-hidden /> Standard colors
        </button>
      )}
    </section>
  );
}

/** A color input needs #rrggbb. */
function normalizeHex(color: string): string {
  const short = /^#([\da-f])([\da-f])([\da-f])$/i.exec(color);
  return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : color;
}

type Own = { own: boolean; reset: () => void } | null;

/** "Own value" with a reset, or "All events", for one event's settings. */
function OwnMarker({ own, reset }: { own: boolean; reset: () => void }) {
  return own ? (
    <button type="button" className="btn btn-ghost btn-xs text-accent" onClick={reset} title="Use the setting for all events">
      <FaArrowRotateLeft aria-hidden /> Own value
    </button>
  ) : (
    <span className="text-xs text-muted">all events</span>
  );
}

function Row({ label, own, children }: { label: string; own?: Own; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex min-w-0 flex-wrap items-center gap-x-2">
        {label}
        {own && <OwnMarker own={own.own} reset={own.reset} />}
      </span>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange, disabled, own }: { label: string; checked: boolean; onChange: (value: boolean) => void; disabled?: boolean; own?: Own }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${disabled ? "opacity-50" : ""}`}>
      <span className="flex min-w-0 flex-wrap items-center gap-x-2">
        {label}
        {own && <OwnMarker own={own.own} reset={own.reset} />}
      </span>
      <input type="checkbox" className="toggle toggle-primary toggle-sm shrink-0" aria-label={label} checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    </div>
  );
}
