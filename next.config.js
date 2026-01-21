/** @type {import('next').NextConfig} */
import withBundleAnalyzer from "@next/bundle-analyzer"
const nextConfig = {
  images: {
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
  webpack: (config, options) => {
    if (!options.dev) {
      config.devtool = options.isServer ? false : "source-map";
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



export default (nextConfig);
