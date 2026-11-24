"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { generateScramble } from "./scrambles";

interface State {
  eventId: string;
  scramble: string | null;
  /** Earlier scrambles for this event, newest last. */
  history: string[];
  error: string | null;
  /** Whether the current scramble was typed in rather than made here. */
  custom: boolean;
}

const empty = (eventId: string): State => ({ eventId, scramble: null, history: [], error: null, custom: false });

/**
 * The current scramble for an event, with the next one made ahead of time
 * so a new scramble is there the moment a solve is saved. `previous` goes
 * back to the last scramble (if a solve was deleted and redone, say).
 */
export function useScramble(eventId: string) {
  const [state, setState] = useState<State>(() => empty(eventId));
  const upcoming = useRef<{ eventId: string; scramble: Promise<string> } | null>(null);

  /** Shows `source` once it's ready (if the event hasn't changed), then makes the next one. */
  const load = useCallback((id: string, source: Promise<string>) => {
    void (async () => {
      try {
        const scramble = await source;
        setState((s) => (s.eventId === id ? { ...s, scramble, error: null, custom: false } : { ...empty(id), scramble }));
      } catch (error) {
        console.error("Scramble failed", error);
        setState((s) => ({ ...(s.eventId === id ? s : empty(id)), error: "Couldn't make a scramble. Try again." }));
        return;
      }
      const next = generateScramble(id);
      next.catch(() => {});
      upcoming.current = { eventId: id, scramble: next };
    })();
  }, []);

  useEffect(() => {
    upcoming.current = null;
    load(eventId, generateScramble(eventId));
  }, [eventId, load]);

  // Until a new event's first scramble is ready, show nothing rather than the old event's.
  const current = state.eventId === eventId ? state : empty(eventId);

  const next = useCallback(() => {
    const id = current.eventId;
    const source = upcoming.current?.eventId === id ? upcoming.current.scramble : generateScramble(id);
    upcoming.current = null;
    setState({ eventId: id, scramble: null, history: current.scramble ? [...current.history, current.scramble] : current.history, error: null, custom: false });
    load(id, source);
  }, [current, load]);

  const previous = useCallback(() => {
    setState((s) => (s.history.length === 0 ? s : { ...s, scramble: s.history.at(-1)!, history: s.history.slice(0, -1), custom: false }));
  }, []);

  /** Uses a scramble typed in (already checked); the one it replaces is kept for Previous. */
  const applyCustom = useCallback((scramble: string) => {
    setState((s) => {
      const base = s.eventId === eventId ? s : empty(eventId);
      return { ...base, scramble, error: null, custom: true, history: base.scramble ? [...base.history, base.scramble] : base.history };
    });
  }, [eventId]);

  return { scramble: current.scramble, error: current.error, custom: current.custom, next, previous, setCustom: applyCustom, canGoBack: current.history.length > 0 };
}
