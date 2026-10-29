import { z } from "zod";
import { fail, ok, type Result } from "@/lib/result";

// Overridable to point local development at a stub server.
export const WCA_API_URL = process.env.WCA_API_URL ?? "https://www.worldcubeassociation.org/api";

// The WCA API allows 60 requests per minute per IP. Callers cache results, but
// a build renders many pages at once, so slow or rate-limited responses are
// retried a few times before giving up.
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [1_000, 4_000];
const MAX_RETRY_AFTER_MS = 15_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

/** Milliseconds to wait from a `Retry-After` header (seconds or HTTP date), if present. */
function retryAfterMs(response: Response): number | null {
  const header = response.headers.get("retry-after");
  if (!header) return null;
  const seconds = Number(header);
  const ms = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(header) - Date.now();
  return Number.isFinite(ms) && ms > 0 ? Math.min(ms, MAX_RETRY_AFTER_MS) : null;
}

async function fetchWithRetry(url: string, path: string): Promise<Result<Response>> {
  for (let attempt = 1; ; attempt++) {
    const lastAttempt = attempt >= MAX_ATTEMPTS;
    const backoff = RETRY_DELAYS_MS[attempt - 1] ?? RETRY_DELAYS_MS.at(-1)!;
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.ok) return ok(response);
      if (lastAttempt || !isRetryableStatus(response.status)) {
        console.error(`WCA request returned ${response.status}: ${path}`);
        return fail(`WCA request returned ${response.status}: ${path}`);
      }
      await sleep(retryAfterMs(response) ?? backoff);
    } catch (error) {
      if (lastAttempt) {
        console.error(`WCA request failed after ${attempt} attempts: ${path}`, error);
        return fail(`WCA request failed: ${path}`);
      }
      await sleep(backoff);
    }
  }
}

/** Fetches a WCA API path (e.g. `/v0/persons/2016GOTT01`) and validates the JSON. */
export async function fetchWca<S extends z.ZodType>(
  path: string,
  schema: S,
): Promise<Result<z.output<S>>> {
  const response = await fetchWithRetry(`${WCA_API_URL}${path}`, path);
  if (!response.ok) return response;

  let json: unknown;
  try {
    json = await response.data.json();
  } catch {
    return fail(`WCA response was not JSON: ${path}`);
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    console.error(`WCA response did not match schema: ${path}\n${z.prettifyError(parsed.error)}`);
    return fail(`WCA response did not match schema: ${path}`);
  }

  return ok(parsed.data);
}
