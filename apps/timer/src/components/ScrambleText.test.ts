import { describe, expect, it } from "vitest";
import { megaminxLines } from "./ScrambleText";

describe("megaminxLines", () => {
  it("splits a Megaminx scramble after each U move", () => {
    const line1 = "R-- D++ R++ D-- R++ D-- R++ D-- R++ D++ U";
    const line2 = "R-- D++ R-- D-- R-- D++ R++ D++ R++ D++ U'";
    expect(megaminxLines(`${line1} ${line2}`)).toEqual([line1, line2]);
    // Line breaks already there (as csTimer exports them) come out the same.
    expect(megaminxLines(`${line1}\n${line2}\n`)).toEqual([line1, line2]);
  });

  it("leaves other puzzles alone", () => {
    expect(megaminxLines("R U R' U' F2")).toBeNull();
    expect(megaminxLines("(1, -3) / (0, 3) /")).toBeNull();
  });
});
