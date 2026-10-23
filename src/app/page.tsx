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
    <div className="flex flex-col grow justify-center items-center m-6">
      {latestVideo && <YoutubeVideo videoId={latestVideo.id} />}
      <Connect />
    </div>
  );
}
