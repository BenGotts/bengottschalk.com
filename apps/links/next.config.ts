import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The link list is cached with "use cache" (see src/lib/data.ts).
  cacheComponents: true,
  // Workspace packages ship TypeScript source.
  transpilePackages: ["@bengottschalk/content", "@bengottschalk/db", "@bengottschalk/theme"],
};

export default nextConfig;
