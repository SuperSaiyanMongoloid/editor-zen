import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enables Partial Pre-Rendering (static shell + streamed dynamic content)
  // and the "use cache" directive for component/function-level caching
  cacheComponents: true,
  // Compiler-level optimisations
  compiler: {
    // Remove console.* calls in production builds
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
