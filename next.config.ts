import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Data is cached with "use cache" + cacheLife in src/lib (see src/lib/wca/api.ts).
  cacheComponents: true,
  partialPrefetching: true,
  // A page waits on the WCA API, retrying slow requests (see src/lib/wca/client.ts);
  // all of a person's results can take well over the default 60 seconds.
  staticPageGenerationTimeout: 180,
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
