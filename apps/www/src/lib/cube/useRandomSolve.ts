import { useState, useSyncExternalStore } from "react";
import { SOLVES, type Solve } from "@/content/solves";

const noSubscription = () => () => {};

/**
 * One of my solves, picked at random each time the component mounts. Null
 * while hydrating server-rendered HTML, which can't know the browser's pick,
 * so the two agree; it's set straight away after that.
 */
export function useRandomSolve(): Solve | null {
  // Only picked in the browser: Next.js won't prerender a page that calls Math.random().
  const [index] = useState(() => (typeof window === "undefined" ? 0 : Math.floor(Math.random() * SOLVES.length)));
  const hydrated = useSyncExternalStore(noSubscription, () => true, () => false);
  return hydrated ? SOLVES[index] : null;
}
