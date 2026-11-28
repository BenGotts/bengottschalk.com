"use client";

// The timer's keyboard shortcuts, all in one list, so the help dialog, the
// button hints and the handlers always agree.
//
// The rule of thumb: Alt with a key changes the last solve (like csTimer's
// Ctrl+1/2/3, which browsers keep for switching tabs), and a plain key moves
// around the app. The space bar is never a shortcut: it always belongs to the
// timer. Shortcuts only work while the timer is idle, never while typing in a
// field or while a dialog is open (Escape closes a dialog on its own).

import { useEffect, useRef } from "react";
import { isTextEntry } from "./useTimer";

export type ShortcutId =
  | "ok" | "plus2" | "dnf" | "delete" | "comment" | "sotd"
  | "nextScramble" | "previousScramble"
  | "event" | "sessions" | "solves" | "stats" | "sotdList" | "settings" | "timer" | "help";

/**
 * A key to press. `code` is the physical key, used with Alt because Alt
 * changes the typed character on a Mac (Option+Z types Ω). Plain shortcuts
 * use `key`, the character typed, so they follow the keyboard layout.
 */
export type KeyCombo = { alt: true; code: string; label: string } | { alt?: false; key: string; label: string };

export interface Shortcut {
  id: ShortcutId;
  combo: KeyCombo;
  /** What it does, as the help dialog lists it. */
  description: string;
  group: "Last solve" | "Scramble" | "Screens";
  /** Only for the site owner's account, like Solve of the Day itself. */
  sotdOnly?: boolean;
}

export const SHORTCUTS: readonly Shortcut[] = [
  { id: "ok", combo: { alt: true, code: "Digit1", label: "Alt+1" }, description: "No penalty (OK)", group: "Last solve" },
  { id: "plus2", combo: { alt: true, code: "Digit2", label: "Alt+2" }, description: "+2", group: "Last solve" },
  { id: "dnf", combo: { alt: true, code: "Digit3", label: "Alt+3" }, description: "DNF", group: "Last solve" },
  { id: "delete", combo: { alt: true, code: "KeyZ", label: "Alt+Z" }, description: "Delete (asks first)", group: "Last solve" },
  { id: "comment", combo: { alt: true, code: "KeyC", label: "Alt+C" }, description: "Comment", group: "Last solve" },
  { id: "sotd", combo: { alt: true, code: "KeyS", label: "Alt+S" }, description: "Mark as Solve of the Day", group: "Last solve", sotdOnly: true },
  { id: "nextScramble", combo: { key: "n", label: "N" }, description: "Next scramble", group: "Scramble" },
  { id: "previousScramble", combo: { key: "p", label: "P" }, description: "Previous scramble", group: "Scramble" },
  { id: "event", combo: { key: "e", label: "E" }, description: "Choose the event", group: "Screens" },
  { id: "sessions", combo: { key: "s", label: "S" }, description: "Sessions", group: "Screens" },
  { id: "solves", combo: { key: "l", label: "L" }, description: "Solve list", group: "Screens" },
  { id: "stats", combo: { key: "a", label: "A" }, description: "Stats and averages", group: "Screens" },
  { id: "sotdList", combo: { key: "d", label: "D" }, description: "Solve of the Day list", group: "Screens", sotdOnly: true },
  { id: "settings", combo: { key: ",", label: "," }, description: "Settings", group: "Screens" },
  { id: "timer", combo: { key: "Escape", label: "Esc" }, description: "Back to the timer (from a list on a small screen)", group: "Screens" },
  { id: "help", combo: { key: "?", label: "?" }, description: "These shortcuts", group: "Screens" },
];

const BY_ID = new Map(SHORTCUTS.map((shortcut) => [shortcut.id, shortcut]));

/** The keys for a shortcut, as shown to people ("Alt+Z"). */
export function shortcutLabel(id: ShortcutId): string {
  return BY_ID.get(id)?.combo.label ?? "";
}

/** A button's tooltip with its shortcut: "Next scramble (N)". */
export function withShortcut(text: string, id: ShortcutId): string {
  return `${text} (${shortcutLabel(id)})`;
}

/** The parts of a key event the matching needs (so tests can pass plain objects). */
export type KeyPress = Pick<KeyboardEvent, "key" | "code" | "altKey" | "ctrlKey" | "metaKey" | "shiftKey">;

/** A single letter, where Shift makes it a different press (Shift+N isn't N). */
const isLetter = (key: string) => /^[a-z]$/i.test(key);

/** The shortcut a key press stands for, if any. */
export function matchShortcut(press: KeyPress, shortcuts: readonly Shortcut[] = SHORTCUTS): Shortcut | null {
  // Ctrl and Cmd combinations belong to the browser and the system.
  if (press.ctrlKey || press.metaKey) return null;
  // The space bar is the timer's, whatever else is held.
  if (press.code === "Space" || press.key === " ") return null;
  for (const shortcut of shortcuts) {
    const { combo } = shortcut;
    if (combo.alt) {
      if (press.altKey && !press.shiftKey && press.code === combo.code) return shortcut;
    } else if (!press.altKey) {
      // Caps Lock still counts as the plain letter; a symbol like ? needs Shift on most layouts, so Shift is fine there.
      const same = isLetter(combo.key) ? !press.shiftKey && press.key.toLowerCase() === combo.key : press.key === combo.key;
      if (same) return shortcut;
    }
  }
  return null;
}

/** Whether focus is somewhere a key press is the person's input: a text field, or a menu that picks options by letter. */
export function isTypingTarget(target: EventTarget | null): boolean {
  return isTextEntry(target) || (typeof HTMLSelectElement !== "undefined" && target instanceof HTMLSelectElement);
}

export type ShortcutHandlers = Partial<Record<ShortcutId, () => void>>;

/**
 * Runs `handlers` when their shortcuts are pressed, while `enabled` (the
 * timer is idle). Several components can each handle their own shortcuts:
 * the buttons under the time handle the last-solve ones, so a shortcut does
 * exactly what its button does.
 */
export function useShortcuts(enabled: boolean, handlers: ShortcutHandlers): void {
  // The latest handlers, read by the listener without re-binding it on every render.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.defaultPrevented || isTypingTarget(e.target) || document.querySelector("dialog[open]")) return;
      const shortcut = matchShortcut(e);
      const handler = shortcut ? handlersRef.current[shortcut.id] : undefined;
      if (!handler) return;
      e.preventDefault();
      handler();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
