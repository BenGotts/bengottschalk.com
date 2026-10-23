import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Data is cached with "use cache" + cacheLife in src/lib (see src/lib/wca/api.ts).
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // YouTube video thumbnails.
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" }],
  },
};

export default nextConfig;
