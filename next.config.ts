import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compiler-level optimisations
  compiler: {
    // Remove console.* calls in production builds
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
