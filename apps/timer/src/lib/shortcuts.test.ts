import { describe, expect, it } from "vitest";
import { matchShortcut, SHORTCUTS, shortcutLabel, withShortcut, type KeyPress } from "./shortcuts";

const press = (changes: Partial<KeyPress>): KeyPress => ({ key: "", code: "", altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, ...changes });
const matched = (changes: Partial<KeyPress>) => matchShortcut(press(changes))?.id ?? null;

describe("matching key presses to shortcuts", () => {
  it("takes Alt with a key for the last solve, by the physical key", () => {
    expect(matched({ key: "1", code: "Digit1", altKey: true })).toBe("ok");
    expect(matched({ key: "2", code: "Digit2", altKey: true })).toBe("plus2");
    expect(matched({ key: "3", code: "Digit3", altKey: true })).toBe("dnf");
    expect(matched({ key: "z", code: "KeyZ", altKey: true })).toBe("delete");
    // Option on a Mac types another character, but the key is the same.
    expect(matched({ key: "Ω", code: "KeyZ", altKey: true })).toBe("delete");
    expect(matched({ key: "ß", code: "KeyS", altKey: true })).toBe("sotd");
  });

  it("doesn't take the last-solve keys without Alt, or with Shift too", () => {
    expect(matched({ key: "1", code: "Digit1" })).toBeNull();
    expect(matched({ key: "!", code: "Digit1", altKey: true, shiftKey: true })).toBeNull();
  });

  it("takes plain keys by the character typed, so they follow the keyboard layout", () => {
    expect(matched({ key: "n", code: "KeyN" })).toBe("nextScramble");
    // A French AZERTY keyboard has A where QWERTY has Q: pressing the A it shows opens the stats.
    expect(matched({ key: "a", code: "KeyQ" })).toBe("stats");
    expect(matched({ key: "?", code: "Slash", shiftKey: true })).toBe("help");
    expect(matched({ key: ",", code: "Comma" })).toBe("settings");
    expect(matched({ key: "Escape", code: "Escape" })).toBe("timer");
  });

  it("counts Caps Lock as the plain letter, but not Shift", () => {
    expect(matched({ key: "N", code: "KeyN" })).toBe("nextScramble");
    expect(matched({ key: "N", code: "KeyN", shiftKey: true })).toBeNull();
  });

  it("leaves plain keys alone when Alt is held", () => {
    expect(matched({ key: "n", code: "KeyN", altKey: true })).toBeNull();
  });

  it("leaves Ctrl and Cmd combinations to the browser", () => {
    expect(matched({ key: "1", code: "Digit1", ctrlKey: true })).toBeNull();
    expect(matched({ key: "1", code: "Digit1", altKey: true, ctrlKey: true })).toBeNull();
    expect(matched({ key: "z", code: "KeyZ", metaKey: true })).toBeNull();
    expect(matched({ key: "n", code: "KeyN", metaKey: true })).toBeNull();
  });

  it("never takes the space bar, which belongs to the timer", () => {
    expect(matched({ key: " ", code: "Space" })).toBeNull();
    expect(matched({ key: " ", code: "Space", altKey: true })).toBeNull();
    expect(matched({ key: " ", code: "Space", shiftKey: true })).toBeNull();
  });

  it("ignores keys that aren't shortcuts", () => {
    expect(matched({ key: "x", code: "KeyX" })).toBeNull();
    expect(matched({ key: "Enter", code: "Enter" })).toBeNull();
  });
});

describe("the shortcut list", () => {
  it("gives every shortcut its own keys", () => {
    const keys = SHORTCUTS.map(({ combo }) => (combo.alt ? `alt ${combo.code}` : combo.key));
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(SHORTCUTS.map((s) => s.id)).size).toBe(SHORTCUTS.length);
  });

  it("matches each shortcut by its own keys", () => {
    for (const shortcut of SHORTCUTS) {
      const { combo } = shortcut;
      const e = combo.alt ? press({ code: combo.code, key: "", altKey: true }) : press({ key: combo.key, shiftKey: combo.key === "?" });
      expect(matchShortcut(e)?.id).toBe(shortcut.id);
    }
  });

  it("never uses keys browsers keep for themselves", () => {
    // Alt+D, Alt+E and Alt+F reach the address bar and the browser menu; Alt+arrows go back and forward.
    const reserved = new Set(["KeyD", "KeyE", "KeyF", "ArrowLeft", "ArrowRight", "Home"]);
    for (const { combo } of SHORTCUTS) {
      if (combo.alt) expect(reserved.has(combo.code)).toBe(false);
      else expect(combo.key).not.toBe(" ");
    }
  });

  it("puts the keys in button hints", () => {
    expect(shortcutLabel("delete")).toBe("Alt+Z");
    expect(withShortcut("Next scramble", "nextScramble")).toBe("Next scramble (N)");
  });
});
