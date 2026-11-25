// Checks the Square-1 model used for the scramble picture against cubing.js's own.

import { puzzles } from "cubing/puzzles";
import { randomScrambleForEvent } from "cubing/scramble";
import { describe, expect, it } from "vitest";
import { layerPieces, square1State } from "@bengottschalk/timer-core/square1";

describe("Square-1 scramble picture", () => {
  it("matches cubing.js for random scrambles", async () => {
    const kpuzzle = await puzzles.square1.kpuzzle();
    for (let i = 0; i < 20; i++) {
      const scramble = (await randomScrambleForEvent("sq1")).toString();
      const state = square1State(scramble);
      const expected = kpuzzle.defaultPattern().applyAlg(scramble).patternData;
      expect([...state!.top, ...state!.bottom]).toEqual(expected.WEDGES.pieces);
      expect(state!.middleFlipped).toBe(expected.EQUATOR.orientation[1] !== 0);
      // Every layer splits into whole pieces.
      for (const layer of [state!.top, state!.bottom]) {
        expect(layerPieces(layer).reduce((n, piece) => n + piece.wedges.length, 0)).toBe(12);
      }
    }
  }, 60_000);

  it("reads scrambles written without spaces, and rejects other text", () => {
    expect(square1State("(1,0)/(-1,0)/")).toEqual(square1State("(1, 0) / (-1, 0) /"));
    expect(square1State("R U R'")).toBeNull();
  });
});
