import { z } from "zod";
import { fail, ok, type Result } from "@/lib/result";

export const WCA_API_URL = "https://www.worldcubeassociation.org/api";

// The WCA API allows 60 requests per minute per IP; callers cache results, so
// a timeout is the only protection needed here.
const REQUEST_TIMEOUT_MS = 10_000;

/** Fetches a WCA API path (e.g. `/v0/persons/2016GOTT01`) and validates the JSON. */
export async function fetchWca<S extends z.ZodType>(
  path: string,
  schema: S,
): Promise<Result<z.output<S>>> {
  let response: Response;
  try {
    response = await fetch(`${WCA_API_URL}${path}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    console.error(`WCA request failed: ${path}`, error);
    return fail(`WCA request failed: ${path}`);
  }

  if (!response.ok) {
    console.error(`WCA request returned ${response.status}: ${path}`);
    return fail(`WCA request returned ${response.status}: ${path}`);
  }

  let json: unknown;
  try {
    json = await response.json();
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
