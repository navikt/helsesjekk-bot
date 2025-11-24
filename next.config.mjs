/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    images: {
        qualities: [100],
    },
    serverExternalPackages: [
        '@slack/bolt',
        '@navikt/next-logger',
        'next-logger',
        'pino',
        'pino-socket',
        '@whatwg-node',
        'prom-client',
    ],
    experimental: {
        optimizePackageImports: ['@navikt/ds-react', '@navikt/aksel-icons', 'remeda', 'recharts'],
    },
}

export default nextConfig
