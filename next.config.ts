import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ hostname: "img.clerk.com" }],
  },
  experimental: {
    // Node.js 런타임을 사용하여 Edge Runtime 호환성 문제 해결
    nodeMiddleware: true,
  },
};

export default nextConfig;
