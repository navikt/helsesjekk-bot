import fastify from 'fastify'

import logger from './logger'

export async function configureNaisHealthEndpoints(): Promise<void> {
    const port = +(process.env.PORT || 5000)

    const server = fastify({
        logger: logger,
        disableRequestLogging: true,
    })

    server.get('/internal/is_alive', async () => {
        return { status: 'ok' }
    })

    server.get('/internal/is_ready', async () => {
        return { status: 'ok' }
    })

    await server.listen({ port: port, host: '0.0.0.0' })
}
