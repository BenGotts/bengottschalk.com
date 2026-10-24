import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Data is cached with "use cache" + cacheLife in src/lib (see src/lib/wca/api.ts).
  cacheComponents: true,
  partialPrefetching: true,
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
