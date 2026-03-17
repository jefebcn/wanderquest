import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Firebase Storage
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      // Google user avatars (from Google Sign-In)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  // Enable React strict mode for better dev warnings
  reactStrictMode: true,

  // Allow Three.js / WebGL packages to be bundled
  transpilePackages: ["three"],

  // Silence known harmless webpack warnings from @react-three/fiber
  webpack(config) {
    config.module = config.module ?? {};
    config.module.exprContextCritical = false;
    return config;
  },
};

export default nextConfig;
