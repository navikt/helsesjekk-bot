/**
 * @type {import('next').NextConfig}
 */

import { EventEmitter } from 'stream'

EventEmitter.setMaxListeners(0);

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
