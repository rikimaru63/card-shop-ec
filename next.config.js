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
  // Server Actions の Origin header missing 問題 と deploy 後 ID mismatch 対策。
  // allowedOrigins: Traefik/Cloudflare 経由で Origin header が剥がれても受け入れる本番ドメインを明示。
  // ビルド間の Server Action ID 固定は Coolify env の NEXT_SERVER_ACTIONS_ENCRYPTION_KEY で行う。
  experimental: {
    serverActions: {
      allowedOrigins: [
        'samuraicardhub.com',
        'www.samuraicardhub.com',
        'samuraicardhub-eu.com',
        'www.samuraicardhub-eu.com',
      ],
      bodySizeLimit: '5mb',
    },
  },
}

module.exports = nextConfig