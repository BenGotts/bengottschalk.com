// WCA API requests from the browser. The API allows any origin (CORS), and
// its limit is 60 requests a minute per IP, which here is the visitor's own.
// Requests go one at a time, at least a little over a second apart, and
// slow or rate-limited ones are retried with backoff (as the main site does).

import { z } from "zod";

export const WCA_API_URL = process.env.NEXT_PUBLIC_WCA_API_URL ?? "https://www.worldcubeassociation.org/api";

const TIMEOUT_MS = 30_000;
const MIN_GAP_MS = 1_100;
const RETRY_DELAYS_MS = [2_000, 8_000];
const MAX_RETRY_AFTER_MS = 30_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let queue: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

/** Runs requests one after another, spaced to stay under the rate limit. */
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = lastRequestAt + MIN_GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();
    return task();
  });
  queue = run.catch(() => {});
  return run;
}

function retryAfterMs(response: Response): number | null {
  const header = response.headers.get("retry-after");
  if (!header) return null;
  const seconds = Number(header);
  const ms = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(header) - Date.now();
  return Number.isFinite(ms) && ms > 0 ? Math.min(ms, MAX_RETRY_AFTER_MS) : null;
}

export class WcaRequestError extends Error {
  constructor(message: string, readonly status: number | null = null) {
    super(message);
  }
}

async function getJson(path: string): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    const last = attempt >= RETRY_DELAYS_MS.length;
    let response: Response;
    try {
      response = await enqueue(() => fetch(`${WCA_API_URL}${path}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(TIMEOUT_MS) }));
    } catch {
      if (last) throw new WcaRequestError(`Couldn't reach the WCA: ${path}`);
      await sleep(RETRY_DELAYS_MS[attempt]);
      continue;
    }
    if (response.ok) return response.json();
    if (last || (response.status !== 429 && response.status < 500)) throw new WcaRequestError(`The WCA returned ${response.status}: ${path}`, response.status);
    await sleep(retryAfterMs(response) ?? RETRY_DELAYS_MS[attempt]);
  }
}

/** Fetches a WCA API path (like `/v1/persons/2016GOTT01/results`) and checks its shape. */
export async function fetchWca<S extends z.ZodType>(path: string, schema: S): Promise<z.output<S>> {
  const parsed = schema.safeParse(await getJson(path));
  if (!parsed.success) throw new WcaRequestError(`Unexpected WCA response: ${path}`);
  return parsed.data;
}
