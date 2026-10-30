import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { YOUTUBE_UPLOADS_PLAYLIST_ID } from "@/consts";
import { fail, ok, type Result } from "@/lib/result";

const ThumbnailSchema = z.object({ url: z.string(), width: z.number(), height: z.number() });

const PlaylistItemsSchema = z.object({
  items: z.array(
    z.object({
      snippet: z.object({
        title: z.string(),
        publishedAt: z.iso.datetime({ offset: true }),
        resourceId: z.object({ videoId: z.string() }),
        thumbnails: z.record(z.string(), ThumbnailSchema),
      }),
      status: z.object({ privacyStatus: z.string() }),
    }),
  ),
});

export interface Video {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail: z.infer<typeof ThumbnailSchema> | null;
}

const THUMBNAIL_PREFERENCE = ["maxres", "standard", "high", "medium", "default"];

/** Latest public uploads from the channel, newest first. */
export async function getLatestVideos(limit = 6): Promise<Result<Video[]>> {
  "use cache";
  cacheTag("youtube");

  const result = await fetchLatestVideos(limit);
  if (result.ok) {
    cacheLife("hours");
  } else {
    cacheLife("minutes");
  }
  return result;
}

async function fetchLatestVideos(limit: number): Promise<Result<Video[]>> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return fail("YOUTUBE_API_KEY is not set");

  const params = new URLSearchParams({
    part: "snippet,status",
    // Ask for extra items so private or deleted videos don't shrink the list.
    maxResults: String(Math.min(limit + 5, 50)),
    playlistId: YOUTUBE_UPLOADS_PLAYLIST_ID,
    key: apiKey,
  });

  let json: unknown;
  try {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error(`YouTube request returned ${response.status}`);
      return fail(`YouTube request returned ${response.status}`);
    }
    json = await response.json();
  } catch (error) {
    console.error("YouTube request failed", error);
    return fail("YouTube request failed");
  }

  const parsed = PlaylistItemsSchema.safeParse(json);
  if (!parsed.success) {
    console.error(`YouTube response did not match schema\n${z.prettifyError(parsed.error)}`);
    return fail("YouTube response did not match schema");
  }

  return ok(
    parsed.data.items
      .filter((item) => item.status.privacyStatus === "public")
      .slice(0, limit)
      .map(({ snippet }) => ({
        id: snippet.resourceId.videoId,
        title: snippet.title,
        publishedAt: snippet.publishedAt,
        thumbnail:
          THUMBNAIL_PREFERENCE.map((size) => snippet.thumbnails[size]).find((thumb) => thumb !== undefined) ?? null,
      })),
  );
}
