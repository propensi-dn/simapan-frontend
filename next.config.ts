import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
      },
      // Production - Cloudinary
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      // Production - Koyeb 
      {
        protocol: 'https',
        hostname: 'empirical-harrietta-simapan-6d52f2ea.koyeb.app',
      },
    ],
  },
};

export default nextConfig;