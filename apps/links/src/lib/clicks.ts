import { isbot } from "isbot";
import type { Device } from "@bengottschalk/db/schema";

/**
 * Whether a request to /go/<id> is a person clicking: not a bot, crawler,
 * or link-preview fetcher, and not a browser prefetching the link.
 */
export function isCountableClick(headers: Headers): boolean {
  const purpose = `${headers.get("purpose") ?? ""} ${headers.get("sec-purpose") ?? ""} ${headers.get("x-purpose") ?? ""}`;
  if (/prefetch|preview/i.test(purpose) || headers.get("x-moz") === "prefetch") return false;
  const userAgent = headers.get("user-agent");
  // Browsers always send a user agent; scripts often don't.
  return Boolean(userAgent) && !isbot(userAgent);
}

export function deviceFromUserAgent(userAgent: string | null): Device | null {
  if (!userAgent) return null;
  if (/iPad|Tablet|Kindle|Silk|PlayBook|Android(?!.*Mobile)/i.test(userAgent)) return "tablet";
  if (/Mobi|iPhone|iPod|Android|BlackBerry|Opera Mini|IEMobile/i.test(userAgent)) return "mobile";
  return "desktop";
}

/** Lowercase letters, digits, dots and dashes, up to 40 characters: e.g. `instagram` or `youtube.com`. */
function cleanSource(value: string): string | null {
  const source = value.trim().toLowerCase().replace(/^www\./, "");
  return /^[a-z0-9.-]{1,40}$/.test(source) ? source : null;
}

/**
 * Where a visitor came from, for click stats. A `?src=` tag on the links page
 * URL wins (social apps' in-app browsers often send no referrer); otherwise the
 * referring site's host, ignoring the links page itself.
 */
export function sourceFrom({ src, referrer, ownHost }: { src?: string | null; referrer?: string | null; ownHost?: string | null }): string | null {
  if (src) return cleanSource(src);
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname;
    if (ownHost && host === ownHost.split(":")[0]) return null;
    return cleanSource(host);
  } catch {
    return null;
  }
}
