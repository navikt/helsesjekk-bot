/**
 * @type {import('next').NextConfig}
 */

const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
        dirs: ['src'],
    },
    experimental: {
        serverComponentsExternalPackages: ['@slack/bolt'],
    },
}

export default nextConfig
