import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["leaflet", "react-leaflet"],
  serverExternalPackages: ["bcryptjs", "pg"],
};

export default nextConfig;
