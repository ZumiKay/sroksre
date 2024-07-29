const MillionLint = require("@million/lint");
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
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
    PAYPAL_ID:
      "Acg0Px9dS0RhfeZYuZ2cDMTziacWUMn5f0R_7QWdBqx5YJtXj-gXHMGR7kPKqpBDgRdz5sUYbZWCrA9Q",
    BASE_URL: "http://localhost:3000",
  },
};
module.exports = nextConfig;
