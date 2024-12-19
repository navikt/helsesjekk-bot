/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
        dirs: ['src'],
    },
    serverExternalPackages: ['prisma', '@navikt/next-logger', '@slack/bolt'],
    experimental: {
        optimizePackageImports: ['@navikt/ds-react', '@navikt/aksel-icons', 'remeda', 'recharts'],
    },
}

export default nextConfig
