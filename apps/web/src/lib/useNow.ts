"use client";

import { useSyncExternalStore } from "react";

const STEP_MS = 30_000;

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, STEP_MS);
  return () => clearInterval(id);
}

// Rounded so repeated reads within one step return the same value.
const getNow = () => Math.floor(Date.now() / STEP_MS) * STEP_MS;
const getServerNow = () => null;

/**
 * The browser's current time, updated every 30 seconds. `null` during server
 * rendering and hydration, so time-dependent UI only appears in the browser.
 */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getNow, getServerNow);
}
