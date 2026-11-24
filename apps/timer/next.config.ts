import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source.
  transpilePackages: ["@bengottschalk/content", "@bengottschalk/theme", "@bengottschalk/timer-core", "@bengottschalk/wca"],
};

export default nextConfig;
