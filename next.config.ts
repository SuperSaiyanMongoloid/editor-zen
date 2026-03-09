import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Partial Pre-Rendering: serve a static shell instantly, stream dynamic content
    ppr: "incremental",
  },
  // Compiler-level optimisations
  compiler: {
    // Remove console.* calls in production builds
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
