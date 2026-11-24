import { afterEach, describe, expect, it } from "vitest";
import { serverEnv } from "./env";

describe("serverEnv", () => {
  afterEach(() => {
    delete process.env.TIMER_TEST_VAR;
  });
  it("treats unset, blank and REPLACE_ME placeholders as unset", () => {
    expect(serverEnv("TIMER_TEST_VAR")).toBeUndefined();
    process.env.TIMER_TEST_VAR = "  ";
    expect(serverEnv("TIMER_TEST_VAR")).toBeUndefined();
    process.env.TIMER_TEST_VAR = "REPLACE_ME_with_the_wca_client_id";
    expect(serverEnv("TIMER_TEST_VAR")).toBeUndefined();
    process.env.TIMER_TEST_VAR = "abc";
    expect(serverEnv("TIMER_TEST_VAR")).toBe("abc");
  });
});
