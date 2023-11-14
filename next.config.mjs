/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {

    eslint: {
        ignoreDuringBuilds: true,
        dirs: ['src'],
    },
    experimental: {
        serverComponentsExternalPackages: ['@navikt/next-logger', 'next-logger', '@slack/bolt'],
    },
}

export default nextConfig
