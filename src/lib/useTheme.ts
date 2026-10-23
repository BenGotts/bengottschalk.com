"use client";

import { useSyncExternalStore } from "react";
import { THEMES, type ThemeName } from "@/lib/theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const getTheme = (): ThemeName => (document.documentElement.dataset.theme === THEMES.light ? THEMES.light : THEMES.dark);
const getServerTheme = (): ThemeName => THEMES.dark;

/** The active DaisyUI theme, updating when the toggle changes it. */
export function useTheme(): ThemeName {
  return useSyncExternalStore(subscribe, getTheme, getServerTheme);
}
