import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "www.cesarreyesjaramillo.com",
      },
      {
        protocol: "https",
        hostname: "cesarreyesjaramillo.com",
      },
    ],
  },
};

export default nextConfig;
