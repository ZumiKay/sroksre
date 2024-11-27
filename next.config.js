/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "jrkeurxhiddg4zho.public.blob.vercel-storage.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
    ],
  },
  env: {
    KEY_FRONTEND:
      "4dc0180d676e9ba23390ad6cdd3cdb62271273d23af1f4d2f411b97a1cf20af7",
  },
  webpack: (config, options) => {
    if (!options.dev) {
      config.devtool = options.isServer ? false : "source-map";
    }
    return config;
  },
};

module.exports = nextConfig;

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer(nextConfig);
