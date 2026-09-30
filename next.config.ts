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
  async redirects() {
    return [
      {
        source: "/eventos/categoria/artes-vivas",
        destination: "/festival-artes-vivas-loja-2026",
        permanent: true,
      },
      {
        source: "/fiavl",
        destination: "/festival-artes-vivas-loja-2026",
        permanent: false,
      },
      {
        source: "/fiavl-2026",
        destination: "/festival-artes-vivas-loja-2026",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
