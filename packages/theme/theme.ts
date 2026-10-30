// DaisyUI theme names, defined in theme.css.
export const THEMES = { dark: "midnight", light: "midnight-light" } as const;
export type ThemeName = (typeof THEMES)[keyof typeof THEMES];

export const THEME_STORAGE_KEY = "theme";

/**
 * Inline script for <head>: applies a saved theme before first paint so a
 * visitor who picked light mode doesn't see a dark flash.
 */
export const themeInitScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t===${JSON.stringify(THEMES.dark)}||t===${JSON.stringify(THEMES.light)})document.documentElement.dataset.theme=t}catch(e){}`;
