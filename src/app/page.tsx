import type { Metadata } from "next";
import YoutubeVideo from "@/components/YoutubeVideo";
import Connect from "@/components/about/Connect";
import { getLatestVideos } from "@/lib/youtube";

export const metadata: Metadata = {
  title: 'Home | bengottschalk.com',
  description: 'The official website for Benjamin Gottschalk.',
}

export default async function Home() {
  const videos = await getLatestVideos(1);
  const latestVideo = videos.ok ? videos.data[0] : undefined;

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-14">
      {latestVideo && <YoutubeVideo videoId={latestVideo.id} title={latestVideo.title} />}
      <Connect />
    </div>
  );
}
