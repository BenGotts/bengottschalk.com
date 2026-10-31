import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source.
  transpilePackages: ["@bengottschalk/content", "@bengottschalk/db", "@bengottschalk/theme", "@bengottschalk/wca"],
  // OAuth discovery documents. MCP clients look for them at the root and with the
  // issuer (/api/auth) or resource (/private) path appended.
  rewrites() {
    return [
      { source: "/.well-known/oauth-authorization-server/:path*", destination: "/api/well-known/oauth-authorization-server" },
      { source: "/.well-known/openid-configuration/:path*", destination: "/api/well-known/openid-configuration" },
      { source: "/.well-known/oauth-protected-resource/:path*", destination: "/api/well-known/oauth-protected-resource" },
    ];
  },
};

export default nextConfig;
