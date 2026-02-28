/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://api-gateway:80/api/v1/:path*",
      },
      {
        source: "/r/:shortCode",
        destination: "http://api-gateway:80/:shortCode",
      },
    ];
  },
};

module.exports = nextConfig;
