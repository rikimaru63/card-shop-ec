/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'cloudinary.com', 'res.cloudinary.com', 'images.unsplash.com', 'images.samuraicardhub.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.samuraicardhub.com',
      },
    ],
    dangerouslyAllowSVG: true,
  },
}

module.exports = nextConfig