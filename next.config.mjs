/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/signin", destination: "/login" },
      { source: "/sign-in", destination: "/login" },
    ];
  },
};

export default nextConfig;
