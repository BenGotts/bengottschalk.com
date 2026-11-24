// The timer's settings: one set for all events, and per-event overrides of
// the ones that differ between events (inspection, hold time, scramble
// picture colors…). Kept on this device.

import type { Precision } from "@bengottschalk/timer-core/time";
import { timerEvent, type EventFormat } from "@bengottschalk/timer-core/events";
import { averageLabel, parseAverageLabel, uniqueSpecs, type AverageSpec } from "@bengottschalk/timer-core/stats";
import { colorFamilyFor, type ColorScheme } from "./colorSchemes";

export interface Settings {
  /** How times are shown. They're always saved to the thousandth. */
  precision: Precision;
  /** WCA inspection for events that have it. */
  inspection: boolean;
  /** Say "8 seconds" and "12 seconds" during inspection. */
  inspectionVoice: boolean;
  /** How long to hold before the timer turns green, in ms. */
  holdMs: number;
  /** Show "solving" instead of the running time. */
  hideRunningTime: boolean;
  /** Time with the timer, or type times in. */
  entry: "timer" | "typing";
  /** Blindfolded: the first press while solving marks the end of memo. */
  bldMemoSplit: boolean;
  showScrambleImage: boolean;
  /** Scramble picture colors for each puzzle family (see colorSchemes.ts); empty means the standard colors. */
  colors: Record<string, ColorScheme>;
  /**
   * The current averages shown on the timer screen (and phones' stats under
   * it), as labels like "ao5" or "mo3". null: the defaults for the event's
   * format (see `DEFAULT_SCREEN_AVERAGES`).
   */
  screenAverages: string[] | null;
}

/** The averages the timer screen shows by default, by event format. Single-result events (Multi-Blind) have none. */
export const DEFAULT_SCREEN_AVERAGES: Record<EventFormat, readonly string[]> = {
  ao5: ["ao5", "ao12"],
  mo3: ["mo3", "ao5"],
  best: [],
};

/** The averages offered as chips in Settings (any other aoN or moN can be typed in). */
export const SCREEN_AVERAGE_CHOICES: readonly string[] = ["mo3", "ao5", "ao12", "ao25", "ao50", "ao100", "ao200", "ao500", "ao1000"];

/** Labels in a steady order: by size, a mean before an average of the same size. Unreadable ones and repeats are dropped. */
export function sortAverageLabels(labels: readonly string[]): string[] {
  const specs = uniqueSpecs(labels.flatMap((label) => {
    const spec = parseAverageLabel(label);
    return spec ? [spec] : [];
  }));
  return specs.toSorted((a, b) => a.size - b.size || (a.kind === b.kind ? 0 : a.kind === "mean" ? -1 : 1)).map(averageLabel);
}

/** The averages to show on the timer screen for an event, from its settings. */
export function screenAverageSpecs(settings: Pick<Settings, "screenAverages">, format: EventFormat): AverageSpec[] {
  if (format === "best") return [];
  return sortAverageLabels(settings.screenAverages ?? DEFAULT_SCREEN_AVERAGES[format]).flatMap((label) => {
    const spec = parseAverageLabel(label);
    return spec ? [spec] : [];
  });
}

export const DEFAULT_SETTINGS: Settings = {
  precision: "hundredths",
  inspection: true,
  inspectionVoice: true,
  holdMs: 300,
  hideRunningTime: false,
  entry: "timer",
  bldMemoSplit: false,
  showScrambleImage: true,
  colors: {},
  screenAverages: null,
};

/** Settings an event can set for itself; the rest apply to every event. */
export const EVENT_SETTINGS = ["inspection", "holdMs", "hideRunningTime", "entry", "bldMemoSplit", "showScrambleImage", "screenAverages"] as const;
export type EventSettingKey = (typeof EVENT_SETTINGS)[number];

/** What one event sets differently from all events. `colors` is for the event's own puzzle family. */
export type EventOverrides = Partial<Pick<Settings, EventSettingKey>> & { colors?: ColorScheme };

export interface StoredSettings {
  version: 2;
  /** For all events. */
  global: Settings;
  /** By event id. */
  events: Record<string, EventOverrides>;
}

/** Settings for one event: the global ones with the event's overrides, plus its picture colors. */
export interface EventSettingsView extends Settings {
  /** The colors for this event's scramble picture. */
  scheme: ColorScheme;
}

export const DEFAULT_STORED: StoredSettings = { version: 2, global: DEFAULT_SETTINGS, events: {} };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Reads what was saved, in either shape: version 1 was one flat set of
 * settings (now the global ones), version 2 adds per-event overrides.
 */
export function migrateSettings(saved: unknown): StoredSettings {
  if (!isRecord(saved)) return DEFAULT_STORED;
  if (saved.version === 2 && isRecord(saved.global)) {
    // Saved by this version of the timer.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const global = { ...DEFAULT_SETTINGS, ...(saved.global as Partial<Settings>) };
    global.screenAverages = readAverages(global.screenAverages) ?? null;
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const events = isRecord(saved.events) ? { ...(saved.events as Record<string, EventOverrides>) } : {};
    for (const [id, overrides] of Object.entries(events)) {
      if (overrides.screenAverages === undefined) continue;
      const averages = readAverages(overrides.screenAverages);
      const next = { ...overrides };
      if (averages === undefined) delete next.screenAverages;
      else next.screenAverages = averages;
      events[id] = next;
    }
    return { version: 2, global, events };
  }
  // Version 1: a flat Partial<Settings>.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return { version: 2, global: { ...DEFAULT_SETTINGS, ...(saved as Partial<Settings>) }, events: {} };
}

/** A saved list of averages, or null (the defaults); undefined when it's neither. */
function readAverages(value: unknown): string[] | null | undefined {
  if (value === null) return null;
  if (!Array.isArray(value)) return undefined;
  return sortAverageLabels(value.filter((v): v is string => typeof v === "string"));
}

/** The settings in effect for an event. */
export function settingsForEvent(stored: StoredSettings, eventId: string): EventSettingsView {
  const overrides = stored.events[eventId] ?? {};
  const { colors: eventColors, ...rest } = overrides;
  const merged: Settings = { ...stored.global };
  for (const key of EVENT_SETTINGS) {
    if (rest[key] !== undefined) Object.assign(merged, { [key]: rest[key] });
  }
  return { ...merged, scheme: colorsForEvent(stored, eventId, eventColors) };
}

/** The scramble picture colors for an event: its family's global colors, with the event's own on top. */
export function colorsForEvent(stored: StoredSettings, eventId: string, eventColors = stored.events[eventId]?.colors): ColorScheme {
  const family = colorFamilyFor(timerEvent(eventId).puzzleId);
  if (!family) return {};
  return { ...stored.global.colors[family.id], ...eventColors };
}

/** Sets a global setting. */
export function setGlobal<K extends keyof Settings>(stored: StoredSettings, key: K, value: Settings[K]): StoredSettings {
  return { ...stored, global: { ...stored.global, [key]: value } };
}

/** Sets (or, with `undefined`, clears) one event's own value for a setting. */
export function setForEvent<K extends EventSettingKey>(stored: StoredSettings, eventId: string, key: K, value: Settings[K] | undefined): StoredSettings {
  const current: EventOverrides = { ...stored.events[eventId] };
  if (value === undefined) delete current[key];
  else Object.assign(current, { [key]: value });
  return withEvent(stored, eventId, current);
}

/** Sets an event's own colors (empty or undefined: back to the colors for all events). */
export function setEventColors(stored: StoredSettings, eventId: string, colors: ColorScheme | undefined): StoredSettings {
  const current: EventOverrides = { ...stored.events[eventId] };
  if (!colors || Object.keys(colors).length === 0) delete current.colors;
  else current.colors = colors;
  return withEvent(stored, eventId, current);
}

/** Sets the colors for all events of a puzzle family. */
export function setFamilyColors(stored: StoredSettings, familyId: string, colors: ColorScheme): StoredSettings {
  const all = { ...stored.global.colors };
  if (Object.keys(colors).length === 0) delete all[familyId];
  else all[familyId] = colors;
  return setGlobal(stored, "colors", all);
}

/** Drops all of an event's own settings. */
export function resetEvent(stored: StoredSettings, eventId: string): StoredSettings {
  return withEvent(stored, eventId, {});
}

function withEvent(stored: StoredSettings, eventId: string, overrides: EventOverrides): StoredSettings {
  const events = { ...stored.events };
  if (Object.keys(overrides).length === 0) delete events[eventId];
  else events[eventId] = overrides;
  return { ...stored, events };
}

/** Whether an event has its own value for a setting (or its own colors, for "colors"). */
export const eventOverrides = (stored: StoredSettings, eventId: string, key: EventSettingKey | "colors"): boolean =>
  stored.events[eventId]?.[key] !== undefined;
