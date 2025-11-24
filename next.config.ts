import { NextConfig } from 'next'
import { nodeFileTrace } from '@vercel/nft'

const nextConfig = async (): Promise<NextConfig> => {
    const prisma = await nodeFileTrace([
        require.resolve('dotenv'),
        require.resolve('dotenv/config'),
        require.resolve('@prisma/client'),
        require.resolve('@prisma/engines'),
        require.resolve('@prisma/dev'),
        require.resolve('prisma/build/index.js'),
    ])

    return {
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
        outputFileTracingIncludes: {
            '/*': [...prisma.fileList, './node_modules/.bin/prisma', './node_modules/prisma/**'],
        },
        experimental: {
            optimizePackageImports: ['@navikt/ds-react', '@navikt/aksel-icons', 'remeda', 'recharts'],
        },
    }
}

export default nextConfig
