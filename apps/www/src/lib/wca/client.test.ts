import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { fetchWca } from "./client";

describe("fetchWca", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch() {
    const fetch = vi.fn(async () => Response.json({ id: "2016GOTT01", name: "Ben" }));
    vi.stubGlobal("fetch", fetch);
    return fetch;
  }

  it("shares one request between identical calls in flight, each with its own schema", async () => {
    const fetch = stubFetch();
    const [withName, idOnly] = await Promise.all([
      fetchWca("/v0/persons/2016GOTT01", z.object({ id: z.string(), name: z.string() })),
      fetchWca("/v0/persons/2016GOTT01", z.object({ id: z.string() })),
    ]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(withName).toEqual({ ok: true, data: { id: "2016GOTT01", name: "Ben" } });
    expect(idOnly).toEqual({ ok: true, data: { id: "2016GOTT01" } });
  });

  it("asks again once the earlier request has finished", async () => {
    const fetch = stubFetch();
    await fetchWca("/v0/persons/2016GOTT01", z.object({ id: z.string() }));
    await fetchWca("/v0/persons/2016GOTT01", z.object({ id: z.string() }));
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
