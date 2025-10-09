import Hero from "@/components/home/Hero";
import FeaturedServices from "@/components/home/FeaturedServices";
import Experience from "@/components/home/Experience";
import LatestVideo from "@/components/home/LatestVideo";
import CTASection from "@/components/home/CTASection";
import { Metadata } from 'next';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Benjamin Gottschalk | Full-Stack Software Engineer & WCA Delegate',
  description: 'Professional software development services and WCA Delegate. Full-stack engineer specializing in web applications, cloud infrastructure, and AI/ML integration. Organizing international speedcubing competitions.',
}

interface YouTubeAPIResponse {
  items: Array<{
    contentDetails: {
      videoId: string;
    };
  }>;
}

export default async function Home() {
  const videoId = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=1&playlistId=UUY4J5vw3Ed8Rc3Njc-2qzfg&key=${process.env.YOUTUBE_API_KEY}`)
    .then(response => response.json() as Promise<YouTubeAPIResponse>)
    .then(data => data?.items?.[0]?.contentDetails?.videoId)
    .catch(err => {
      console.error(err);
      return undefined;
    });

  return (
    <div className="flex flex-col flex-grow">
      <Hero />
      <FeaturedServices />
      <Experience />
      <LatestVideo videoId={videoId} />
      <CTASection />
    </div>
  );
}
