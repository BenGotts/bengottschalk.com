/**
 * Cube colors for accents. Blue and green lead (the theme's primary and
 * secondary); red, orange and yellow add variety.
 */
export type Tone = "blue" | "green" | "red" | "orange" | "yellow";

// Full class names, so Tailwind finds them.
export const TONE_TEXT: Record<Tone, string> = {
  blue: "text-primary",
  green: "text-secondary",
  red: "text-ink-red",
  orange: "text-ink-orange",
  yellow: "text-ink-yellow",
};

export const TONE_BORDER_HOVER: Record<Tone, string> = {
  blue: "hover:border-primary focus-visible:border-primary",
  green: "hover:border-secondary focus-visible:border-secondary",
  red: "hover:border-ink-red focus-visible:border-ink-red",
  orange: "hover:border-ink-orange focus-visible:border-ink-orange",
  yellow: "hover:border-ink-yellow focus-visible:border-ink-yellow",
};

export const TONE_BORDER: Record<Tone, string> = {
  blue: "border-primary",
  green: "border-secondary",
  red: "border-ink-red",
  orange: "border-ink-orange",
  yellow: "border-ink-yellow",
};
