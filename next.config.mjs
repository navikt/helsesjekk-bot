/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/slack/:path*',
                destination: 'https://slack.com/api/:path*',
            }
        ]
    },
    eslint: {
        ignoreDuringBuilds: true,
        dirs: ['src'],
    },
    experimental: {
        serverComponentsExternalPackages: ['@navikt/next-logger', 'next-logger', '@slack/bolt'],
    },
}

export default nextConfig
