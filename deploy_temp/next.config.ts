import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Remove X-Powered-By header to hide Next.js
  poweredByHeader: false,
  // Hide development indicators in the browser
  devIndicators: false,
};

export default nextConfig;
