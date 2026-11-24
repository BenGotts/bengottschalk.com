"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { generateScramble } from "./scrambles";

interface State {
  eventId: string;
  scramble: string | null;
  /** Earlier scrambles for this event, newest last. */
  history: string[];
  error: string | null;
}

const empty = (eventId: string): State => ({ eventId, scramble: null, history: [], error: null });

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
        setState((s) => (s.eventId === id ? { ...s, scramble, error: null } : { ...empty(id), scramble }));
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
    setState({ eventId: id, scramble: null, history: current.scramble ? [...current.history, current.scramble] : current.history, error: null });
    load(id, source);
  }, [current, load]);

  const previous = useCallback(() => {
    setState((s) => (s.history.length === 0 ? s : { ...s, scramble: s.history.at(-1)!, history: s.history.slice(0, -1) }));
  }, []);

  return { scramble: current.scramble, error: current.error, next, previous, canGoBack: current.history.length > 0 };
}
