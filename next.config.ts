import type { NextConfig } from "next";
import path from "path";

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
  // Especificar el directorio raíz del proyecto para evitar conflictos con otros package-lock.json
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
