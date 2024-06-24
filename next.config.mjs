/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
        dirs: ['src'],
    },
    experimental: {
        optimizePackageImports: ['@navikt/ds-react', '@navikt/aksel-icons', 'remeda', 'recharts'],
        serverComponentsExternalPackages: ['@navikt/next-logger', 'next-logger', '@slack/bolt'],
    },
}

export default nextConfig
