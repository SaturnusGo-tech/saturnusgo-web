/** @type {import('next').NextConfig} */
const isExport = process.env.BUILD_TARGET === 'export';

const nextConfig = {
  output: isExport ? 'export' : 'standalone',
  images: { unoptimized: true },
  trailingSlash: true,
  transpilePackages: ['geist'],

  // опционально: форсим уникальный buildId, чтобы дифы всегда отличались
  // generateBuildId: async () => String(Date.now()),
};

module.exports = nextConfig;
