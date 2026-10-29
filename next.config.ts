import { NextConfig } from 'next'

const nextConfig: NextConfig = {
    output: 'standalone',
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
    // NextJS module tracer weridly doesn't include this direct dependency of Pino
    outputFileTracingIncludes: {
        '/': ['real-require'],
    },
    experimental: {
        optimizePackageImports: ['@navikt/ds-react', '@navikt/aksel-icons', 'remeda'],
    },
    logging: {
        fetches: {
            fullUrl: true,
            hmrRefreshes: true,
        },
    },
}

export default nextConfig
