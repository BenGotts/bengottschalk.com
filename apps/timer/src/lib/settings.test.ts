import { describe, expect, it } from "vitest";
import { colorFamilyFor, isDark, recolorSvg } from "./colorSchemes";
import { averageLabel } from "@bengottschalk/timer-core/stats";
import { timerEvent } from "@bengottschalk/timer-core/events";
import {
  DEFAULT_SETTINGS, DEFAULT_STORED, eventOverrides, migrateSettings, resetEvent, screenAverageSpecs, setEventColors, setFamilyColors, setForEvent, setGlobal, settingsForEvent,
  sortAverageLabels,
} from "./settings";

const shownFor = (stored: Parameters<typeof settingsForEvent>[0], eventId: string) =>
  screenAverageSpecs(settingsForEvent(stored, eventId), timerEvent(eventId).format).map(averageLabel);

describe("averages on the timer screen", () => {
  it("defaults by event format: ao5 and ao12, mo3 and ao5, or none for Multi-Blind", () => {
    expect(shownFor(DEFAULT_STORED, "333")).toEqual(["ao5", "ao12"]);
    expect(shownFor(DEFAULT_STORED, "333bf")).toEqual(["ao5", "ao12"]);
    expect(shownFor(DEFAULT_STORED, "666")).toEqual(["mo3", "ao5"]);
    expect(shownFor(DEFAULT_STORED, "333fm")).toEqual(["mo3", "ao5"]);
    expect(shownFor(DEFAULT_STORED, "333mbf")).toEqual([]);
  });

  it("takes a list for all events, and an event's own list over it", () => {
    let stored = setGlobal(DEFAULT_STORED, "screenAverages", ["ao12", "ao100"]);
    stored = setForEvent(stored, "333oh", "screenAverages", ["ao5"]);
    expect(shownFor(stored, "333")).toEqual(["ao12", "ao100"]);
    expect(shownFor(stored, "777")).toEqual(["ao12", "ao100"]);
    expect(shownFor(stored, "333oh")).toEqual(["ao5"]);
    expect(eventOverrides(stored, "333oh", "screenAverages")).toBe(true);
    // Multi-Blind never shows averages.
    expect(shownFor(stored, "333mbf")).toEqual([]);
    // An empty list shows none; clearing the event's own goes back to the list for all events.
    stored = setForEvent(stored, "333oh", "screenAverages", []);
    expect(shownFor(stored, "333oh")).toEqual([]);
    stored = setForEvent(stored, "333oh", "screenAverages", undefined);
    expect(shownFor(stored, "333oh")).toEqual(["ao12", "ao100"]);
  });

  it("keeps lists in order of size and drops what it can't read", () => {
    expect(sortAverageLabels(["ao100", "ao5", "mo3", "ao3", "ao5", "junk", "ao2"])).toEqual(["mo3", "ao3", "ao5", "ao100"]);
    const stored = migrateSettings({ version: 2, global: { screenAverages: ["ao12", 5, "ao5"] }, events: { "333": { screenAverages: "nope" }, "222": { screenAverages: ["mo3"] } } });
    expect(stored.global.screenAverages).toEqual(["ao5", "ao12"]);
    expect(stored.events).toEqual({ "333": {}, "222": { screenAverages: ["mo3"] } });
    expect(migrateSettings({ version: 2, global: {} }).global.screenAverages).toBeNull();
  });
});

describe("settings", () => {
  it("reads the old flat settings as the settings for all events", () => {
    const stored = migrateSettings({ precision: "thousandths", holdMs: 550, showScrambleImage: false });
    expect(stored.version).toBe(2);
    expect(stored.global).toEqual({ ...DEFAULT_SETTINGS, precision: "thousandths", holdMs: 550, showScrambleImage: false });
    expect(stored.events).toEqual({});
  });

  it("reads nothing (or junk) as the defaults", () => {
    expect(migrateSettings(undefined)).toEqual(DEFAULT_STORED);
    expect(migrateSettings("nope")).toEqual(DEFAULT_STORED);
  });

  it("keeps version 2 settings, filling in settings added later", () => {
    const saved = { version: 2, global: { holdMs: 0 }, events: { sq1: { inspection: false } } };
    const stored = migrateSettings(saved);
    expect(stored.global).toEqual({ ...DEFAULT_SETTINGS, holdMs: 0 });
    expect(stored.events).toEqual({ sq1: { inspection: false } });
  });

  it("uses an event's own values where it has them, and the global ones otherwise", () => {
    let stored = setGlobal(DEFAULT_STORED, "holdMs", 550);
    stored = setForEvent(stored, "333oh", "holdMs", 0);
    stored = setForEvent(stored, "333oh", "inspection", false);
    expect(settingsForEvent(stored, "333oh")).toMatchObject({ holdMs: 0, inspection: false, precision: "hundredths" });
    expect(settingsForEvent(stored, "333")).toMatchObject({ holdMs: 550, inspection: true });
    expect(eventOverrides(stored, "333oh", "holdMs")).toBe(true);
    expect(eventOverrides(stored, "333", "holdMs")).toBe(false);

    // Clearing one value falls back to the global one; resetting drops them all.
    stored = setForEvent(stored, "333oh", "holdMs", undefined);
    expect(settingsForEvent(stored, "333oh").holdMs).toBe(550);
    stored = resetEvent(stored, "333oh");
    expect(stored.events).toEqual({});
  });

  it("gives each event its family's colors, with its own on top", () => {
    let stored = setFamilyColors(DEFAULT_STORED, "cube", { U: "#ffff00" });
    stored = setEventColors(stored, "sq1", { U: "#111111" });
    // 3x3 family events share the cube colors; Square-1 only has its own.
    expect(settingsForEvent(stored, "333").scheme).toEqual({ U: "#ffff00" });
    expect(settingsForEvent(stored, "444bf").scheme).toEqual({ U: "#ffff00" });
    expect(settingsForEvent(stored, "sq1").scheme).toEqual({ U: "#111111" });
    // Clock's picture can't be recolored.
    expect(settingsForEvent(stored, "clock").scheme).toEqual({});
    // Empty colors go back to the colors for all events.
    stored = setEventColors(stored, "sq1", {});
    expect(stored.events.sq1).toBeUndefined();
  });
});

describe("scramble picture colors", () => {
  it("knows which puzzles can be recolored", () => {
    expect(colorFamilyFor("3x3x3")?.id).toBe("cube");
    expect(colorFamilyFor("7x7x7")?.id).toBe("cube");
    expect(colorFamilyFor("square1")?.id).toBe("square1");
    expect(colorFamilyFor("clock")).toBeNull();
  });

  it("swaps each face's fills in a cubing.js SVG, whatever palette it uses", () => {
    const svg = '<rect style="fill: white"/><rect style="fill: #FFFFFF;"/><rect style="fill: limegreen"/><rect style="fill: red"/>';
    expect(recolorSvg(svg, "3x3x3", { U: "#ffff00", F: "#123456" })).toBe(
      '<rect style="fill: #ffff00"/><rect style="fill: #ffff00;"/><rect style="fill: #123456"/><rect style="fill: red"/>',
    );
    // No scheme, or a puzzle that can't be recolored: unchanged.
    expect(recolorSvg(svg, "3x3x3", {})).toBe(svg);
    expect(recolorSvg(svg, "clock", { U: "#000" })).toBe(svg);
  });

  it("tells dark colors apart (for outlines)", () => {
    expect(isDark("#111111")).toBe(true);
    expect(isDark("#ffd500")).toBe(false);
  });
});
