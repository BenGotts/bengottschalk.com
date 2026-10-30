import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { FaYoutube } from "react-icons/fa";
import VideoCard from "@/components/videos/VideoCard";
import { getLatestVideos } from "@/lib/youtube";
import ExternalLink from "@/components/ExternalLink";

export const metadata: Metadata = pageMetadata({
  title: "Videos",
  description: "Ben Gottschalk's latest Rubik's Cube videos from YouTube.",
  path: "/videos",
});

const CHANNEL_URL = "https://www.youtube.com/c/BenjaminGottschalk";

export default async function VideosPage() {
  const videos = await getLatestVideos(12);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Videos</h1>
          <p className="mt-2 text-lg text-muted">My latest uploads on YouTube.</p>
        </div>
        <ExternalLink href={CHANNEL_URL} className="btn btn-primary">
          <FaYoutube aria-hidden="true" /> Subscribe on YouTube
        </ExternalLink>
      </header>

      {videos.ok && videos.data.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {videos.data.map((video, index) => (
            <VideoCard key={video.id} video={video} priority={index < 3} headingLevel="h2" />
          ))}
        </div>
      ) : (
        <div role="alert" className="alert alert-warning">
          Videos couldn&apos;t be loaded right now.{" "}
          <ExternalLink href={CHANNEL_URL} className="link">Watch on YouTube</ExternalLink> instead.
        </div>
      )}
    </div>
  )
}
