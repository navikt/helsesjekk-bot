import fastify from 'fastify'
import logger from './logger'

const server = fastify({ logger })

server.get('/slack/interactivity', async (request) => {
    logger.info(JSON.stringify(request.body, null, 2))

    return { ok: 'ok' }
})

server.get('/internal/is_alive', async () => {
    return { ok: 'ok' }
})

server.get('/internal/is_ready', async () => {
    return { ok: 'ok' }
})

server.listen({ port: 5000, host: '0.0.0.0' }, (err) => {
    if (err) {
        console.error(err)
        process.exit(1)
    }
})

