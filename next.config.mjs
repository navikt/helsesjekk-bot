/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
<<<<<<< HEAD
=======

>>>>>>> f6d816f9159c5eeaae1eb36a7cc1f96ab1c463b2
    eslint: {
        ignoreDuringBuilds: true,
        dirs: ['src'],
    },
    experimental: {
        serverComponentsExternalPackages: ['@navikt/next-logger', 'next-logger', '@slack/bolt'],
    },
}

export default nextConfig
