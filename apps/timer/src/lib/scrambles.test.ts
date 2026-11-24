import { describe, expect, it } from "vitest";
import { wcaOrientationSuffix } from "./scrambles";

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
