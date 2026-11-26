import { describe, expect, it } from "vitest";
import { megaminxLines } from "./scrambleLines";

describe("megaminxLines", () => {
  it("breaks after each U and U'", () => {
    expect(megaminxLines("R++ D-- U R-- D++ U' R++ D++ U")).toEqual(["R++ D-- U", "R-- D++ U'", "R++ D++ U"]);
  });

  it("gives the same lines whether the scramble had line breaks or not", () => {
    const lines = ["R++ D++ R-- D-- R++ D-- R-- D-- R++ D++ U", "R++ D-- R++ D++ R++ D++ R-- D-- R++ D-- U'"];
    expect(megaminxLines(lines.join("\n"))).toEqual(lines);
    expect(megaminxLines(lines.join(" "))).toEqual(lines);
    expect(megaminxLines(`  ${lines.join("  \n ")}\n`)).toEqual(lines);
  });

  it("keeps moves after the last U on a line of their own", () => {
    expect(megaminxLines("R++ D-- U R-- D++")).toEqual(["R++ D-- U", "R-- D++"]);
  });
});
