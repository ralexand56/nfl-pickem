import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { serverActions: { allowedOrigins: ["*"] } },
  // Links from before groups existed all belonged to the family group.
  async redirects() {
    return [
      { source: "/week/:path*", destination: "/g/alexander/week/:path*", permanent: false },
      { source: "/squares", destination: "/g/alexander/squares", permanent: false },
      { source: "/squares/:path*", destination: "/g/alexander/squares/:path*", permanent: false },
      { source: "/admin/squares-games/:path*", destination: "/g/alexander/admin/squares/:path*", permanent: false },
      { source: "/admin/squares-games", destination: "/g/alexander/admin/squares", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "graph.facebook.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
