import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Data is cached with "use cache" + cacheLife in src/lib (see src/lib/wca/api.ts).
  cacheComponents: true,
  partialPrefetching: true,
  // Competitions and results moved under one Cubing section.
  redirects() {
    return [
      { source: "/competitions", destination: "/cubing/competitions", permanent: true },
      { source: "/results", destination: "/cubing/results", permanent: true },
      { source: "/results/:event", destination: "/cubing/results/:event", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      // YouTube video thumbnails.
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
      // WCA profile photos.
      { protocol: "https", hostname: "avatars.worldcubeassociation.org" },
    ],
  },
};

export default nextConfig;
