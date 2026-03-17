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
      // Unsplash placeholder images
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  reactStrictMode: true,

  // three.js is used in components/features/ar/ARView.tsx
  transpilePackages: ["three"],
};

export default nextConfig;
