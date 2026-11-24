import { describe, expect, it } from "vitest";
import { formatAverage, formatTime, parseTime } from "./time";

describe("formatTime", () => {
  it("cuts singles off instead of rounding", () => {
    expect(formatTime(12349)).toBe("12.34");
    expect(formatTime(12349, "thousandths")).toBe("12.349");
    expect(formatTime(999)).toBe("0.99");
  });
  it("shows minutes and hours", () => {
    expect(formatTime(62_345)).toBe("1:02.34");
    expect(formatTime(3_723_450, "thousandths")).toBe("1:02:03");
  });
  it("rounds ten minutes or more to the second", () => {
    expect(formatTime(600_499)).toBe("10:00");
    expect(formatTime(600_500)).toBe("10:01");
  });
  it("shows DNF for Infinity", () => {
    expect(formatTime(Infinity)).toBe("DNF");
  });
});

describe("formatAverage", () => {
  it("rounds averages", () => {
    expect(formatAverage(12345)).toBe("12.35");
    expect(formatAverage(12344.4)).toBe("12.34");
    expect(formatAverage(12344.6, "thousandths")).toBe("12.345");
    expect(formatAverage(59_996)).toBe("1:00.00");
  });
});

describe("parseTime", () => {
  it("keeps typed thousandths exactly", () => {
    expect(parseTime("12.345")).toEqual({ ms: 12345, penalty: "none" });
    expect(parseTime("1:02.3")).toEqual({ ms: 62300, penalty: "none" });
    expect(parseTime("1:02:03.45")).toEqual({ ms: 3_723_450, penalty: "none" });
  });
  it("reads digits the way csTimer does", () => {
    expect(parseTime("1234")).toEqual({ ms: 12340, penalty: "none" });
    expect(parseTime("12345")).toEqual({ ms: 83450, penalty: "none" });
    expect(parseTime("12345", "thousandths")).toEqual({ ms: 12345, penalty: "none" });
    expect(parseTime("5")).toEqual({ ms: 50, penalty: "none" });
  });
  it("reads penalties", () => {
    expect(parseTime("12.34+")).toEqual({ ms: 12340, penalty: "+2" });
    expect(parseTime("12.34+2")).toEqual({ ms: 12340, penalty: "+2" });
    expect(parseTime("DNF(12.34)")).toEqual({ ms: 12340, penalty: "dnf" });
    expect(parseTime("dnf")).toEqual({ ms: 0, penalty: "dnf" });
  });
  it("rejects nonsense", () => {
    expect(parseTime("")).toBeNull();
    expect(parseTime("abc")).toBeNull();
    expect(parseTime("1:75.00")).toBeNull();
    expect(parseTime("17500")).toBeNull();
  });
});
