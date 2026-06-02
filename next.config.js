/** @type {import('next').NextConfig} */
import withBundleAnalyzer from "@next/bundle-analyzer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  outputFileTracingRoot: __dirname,
  // Enable browser source maps in production builds (replaces webpack devtool config)
  productionBrowserSourceMaps: true,
  // Turbopack is the default bundler in Next.js 16; no extra config needed
  turbopack: {},
  images: {
    qualities: [50, 75, 80, 85, 90, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jrkeurxhiddg4zho.public.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/**",
      },
    ],
  },
  env: {
    KEY_FRONTEND:
      "4dc0180d676e9ba23390ad6cdd3cdb62271273d23af1f4d2f411b97a1cf20af7",
  },
  // webpack config is only used when running `next dev --webpack` or `next build --webpack`
  // Turbopack is now the default bundler in Next.js 16
  webpack: (config, options) => {
    if (options.dev) {
      // Avoid flaky filesystem cache writes in development (ENOENT on pack rename).
      config.cache = {
        type: "memory",
      };
    }

    // Handle node: protocol imports (fixes UnhandledSchemeError for node:crypto)
    config.resolve = config.resolve || {};
    config.resolve.fallback = config.resolve.fallback || {};

    if (!options.isServer) {
      // For client-side bundles, provide fallbacks for Node.js built-ins
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        fs: false,
        path: false,
        os: false,
      };
    }

    return config;
  },
};

export default nextConfig;
