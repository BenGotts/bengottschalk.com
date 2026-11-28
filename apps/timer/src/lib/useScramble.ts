"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { emptyScrambleState, ScrambleQueue } from "./scrambleQueue";
import { generateScramble } from "./scrambles";

/**
 * The current scramble for an event, with the next one made ahead of time
 * (see ScrambleQueue) so a new scramble is there the moment a solve is
 * finished. `previous` goes back to the last scramble (if a solve was
 * deleted and redone, say).
 */
export function useScramble(eventId: string) {
  const [queue] = useState(() => new ScrambleQueue(generateScramble, eventId));
  const state = useSyncExternalStore(queue.subscribe, queue.getSnapshot, queue.getSnapshot);

  // Stopping on the way out means a scramble still being made for the old event is dropped when it lands.
  useEffect(() => {
    queue.show(eventId);
    return queue.stop;
  }, [queue, eventId]);

  // Until a new event's first scramble is ready, show nothing rather than the old event's.
  const current = state.eventId === eventId ? state : emptyScrambleState(eventId);

  return { scramble: current.scramble, error: current.error, custom: current.custom, next: queue.next, previous: queue.previous, setCustom: queue.applyCustom, canGoBack: current.history.length > 0 };
}
