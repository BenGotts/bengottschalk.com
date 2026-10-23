import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Data is cached with "use cache" + cacheLife in src/lib (see src/lib/wca/api.ts).
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
