import { describe, expect, it, vi } from "vitest";
import { invertScramble, solvesScramble, wcaOrientationSuffix } from "./scrambles";

// The page loads cubing.js from public/vendor; tests use the npm package it's bundled from.
vi.mock("./cubing", () => ({
  loadAlg: () => import("cubing/alg"),
  loadPuzzles: () => import("cubing/puzzles"),
  loadScramble: () => import("cubing/scramble"),
}));

describe("wcaOrientationSuffix", () => {
  it("swaps a final Dw for Uw, keeping the amount", () => {
    expect(wcaOrientationSuffix("R U F2 Rw Dw")).toBe("R U F2 Rw Uw");
    expect(wcaOrientationSuffix("R U F2 Fw' Dw2")).toBe("R U F2 Fw' Uw2");
    expect(wcaOrientationSuffix("R U F2 Dw'")).toBe("R U F2 Uw'");
  });
  it("leaves scrambles without one alone", () => {
    expect(wcaOrientationSuffix("R U F2 Rw")).toBe("R U F2 Rw");
    expect(wcaOrientationSuffix("D R U F2")).toBe("D R U F2");
  });
});

const SCRAMBLE = "R' U' F D2 L2 F R2 U2 R2 B D2 L B2 R' D' F' L2 B' U R' U' F";

describe("invertScramble", () => {
  it("reverses the moves and turns each the other way", async () => {
    expect(await invertScramble("R U' F2 Rw")).toBe("Rw' F2 U R'");
  });
});

describe("solvesScramble", () => {
  it("accepts a solution that solves the cube", async () => {
    expect(await solvesScramble(SCRAMBLE, await invertScramble(SCRAMBLE))).toBe(true);
  });
  it("ignores the whole cube's final orientation", async () => {
    expect(await solvesScramble(SCRAMBLE, `${await invertScramble(SCRAMBLE)} x y2`)).toBe(true);
    // Lw' is R' with the cube turned (x), so it undoes R.
    expect(await solvesScramble("R", "Lw'")).toBe(true);
  });
  it("rejects one that doesn't", async () => {
    expect(await solvesScramble(SCRAMBLE, "R U R' U'")).toBe(false);
    expect(await solvesScramble("R", "")).toBe(false);
  });
});
