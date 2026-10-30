import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source.
  transpilePackages: ["@bengottschalk/content", "@bengottschalk/theme"],
};

export default nextConfig;
