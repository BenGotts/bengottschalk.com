"use client";

import { LuMoon, LuSun } from "react-icons/lu";
import { THEME_STORAGE_KEY, THEMES } from "@bengottschalk/theme";
import { useTheme } from "@/lib/useTheme";

export default function ThemeToggle() {
  const isDark = useTheme() !== THEMES.light;

  const toggle = () => {
    const next = isDark ? THEMES.light : THEMES.dark;
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the theme still applies for this visit.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-ghost btn-square"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? <LuSun className="size-5" aria-hidden="true" /> : <LuMoon className="size-5" aria-hidden="true" />}
    </button>
  );
}
