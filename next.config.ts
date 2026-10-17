import path from "path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Kunci workspace root ke folder repo ini.
  // Tanpa ini Turbopack menyimpulkan root dari lockfile terdekat ke atas, dan kalau
  // ada lockfile lain di direktori induk, build ikut menarik file di luar repo.
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  outputFileTracingIncludes: {
    "/api/baseline": [
      "./src/models/**/*.onnx",
      "./node_modules/onnxruntime-node/bin/napi-v6/linux/**/*",
    ],
  },
  serverExternalPackages: ["onnxruntime-node"],
  images: {
    // Allows profile images returned by common OAuth providers.
    remotePatterns: [
      // Foto kolase landing page (dari desain referensi).
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
