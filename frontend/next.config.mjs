/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Emit directory indexes so Flask can serve canonical trailing-slash routes.
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
