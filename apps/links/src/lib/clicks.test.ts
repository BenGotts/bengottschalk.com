import { describe, expect, it } from "vitest";
import { deviceFromUserAgent, isCountableClick, sourceFrom } from "./clicks";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0";
const ANDROID_PHONE = "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";
const ANDROID_TABLET = "Mozilla/5.0 (Linux; Android 15; SM-X910) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";

describe("isCountableClick", () => {
  it("counts people", () => {
    expect(isCountableClick(new Headers({ "user-agent": IPHONE }))).toBe(true);
    expect(isCountableClick(new Headers({ "user-agent": MAC }))).toBe(true);
  });

  it("skips bots and link-preview fetchers", () => {
    expect(isCountableClick(new Headers({ "user-agent": "facebookexternalhit/1.1" }))).toBe(false);
    expect(isCountableClick(new Headers({ "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" }))).toBe(false);
    expect(isCountableClick(new Headers({ "user-agent": "TelegramBot (like TwitterBot)" }))).toBe(false);
    expect(isCountableClick(new Headers())).toBe(false);
  });

  it("skips prefetches", () => {
    expect(isCountableClick(new Headers({ "user-agent": MAC, "sec-purpose": "prefetch;prerender" }))).toBe(false);
    expect(isCountableClick(new Headers({ "user-agent": MAC, purpose: "prefetch" }))).toBe(false);
  });
});

describe("deviceFromUserAgent", () => {
  it("tells phones, tablets and desktops apart", () => {
    expect(deviceFromUserAgent(IPHONE)).toBe("mobile");
    expect(deviceFromUserAgent(ANDROID_PHONE)).toBe("mobile");
    expect(deviceFromUserAgent(ANDROID_TABLET)).toBe("tablet");
    expect(deviceFromUserAgent(MAC)).toBe("desktop");
    expect(deviceFromUserAgent(null)).toBeNull();
  });
});

describe("sourceFrom", () => {
  it("prefers the src tag", () => {
    expect(sourceFrom({ src: "Instagram", referrer: "https://t.co/x" })).toBe("instagram");
  });

  it("falls back to the referring host, minus www", () => {
    expect(sourceFrom({ referrer: "https://www.youtube.com/watch?v=1" })).toBe("youtube.com");
  });

  it("ignores the links page itself, bad tags and junk referrers", () => {
    expect(sourceFrom({ referrer: "https://links.bengottschalk.com/?src=x", ownHost: "links.bengottschalk.com" })).toBeNull();
    expect(sourceFrom({ src: "<script>" })).toBeNull();
    expect(sourceFrom({ referrer: "not a url" })).toBeNull();
    expect(sourceFrom({})).toBeNull();
  });
});
