import { describe, expect, it } from "vitest";
import { niceTicks } from "./ProgressionChart";

describe("niceTicks", () => {
  it("covers the range in round steps", () => {
    // 3x3: 5.44 to 21.57 seconds, in centiseconds.
    expect(niceTicks(544, 2157)).toEqual([500, 1000, 1500, 2000, 2500]);
    // FMC: 21 to 47 moves.
    expect(niceTicks(21, 47)).toEqual([20, 30, 40, 50]);
  });

  it("handles a single value", () => {
    expect(niceTicks(105, 105)).toEqual([100, 110]);
  });
});
