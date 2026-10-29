import { describe, expect, it } from "vitest";
import { invert, parseScramble } from "./notation";

describe("parseScramble", () => {
  it("reads face turns, primes and half turns", () => {
    expect(parseScramble("R U' F2")).toEqual([
      { notation: "R", axis: 0, layer: 1, dir: 1, amount: 1 },
      { notation: "U'", axis: 1, layer: -1, dir: 1, amount: 1 },
      { notation: "F2", axis: 2, layer: 1, dir: 1, amount: 2 },
    ]);
  });

  it("rejects moves it can't draw", () => {
    expect(() => parseScramble("R Rw")).toThrow('Unsupported move "Rw"');
  });
});

describe("invert", () => {
  it("reverses the moves and turns each the other way", () => {
    expect(invert(parseScramble("R U'")).map((turn) => [turn.axis, turn.dir])).toEqual([[1, -1], [0, -1]]);
  });
});
