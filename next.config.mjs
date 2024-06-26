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
        serverComponentsExternalPackages: ['prisma', '@navikt/next-logger', '@slack/bolt'],
        instrumentationHook: true,
    },
}

export default nextConfig
