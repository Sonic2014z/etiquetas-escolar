import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "strapi.moraleja.cl",
        port: "",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
