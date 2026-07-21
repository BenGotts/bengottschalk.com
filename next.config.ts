import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.worldcubeassociation.org",
        port: "",
        pathname: "/**",
      },
    ],
  }
};

export default nextConfig;
