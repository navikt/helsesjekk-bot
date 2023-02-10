import path from 'node:path'

import fastify from 'fastify'
import staticMiddleware from '@fastify/static'

import logger from './logger'
import { getTeamScoreTimeline } from './db'

export async function configureFastify(): Promise<void> {
    const port = +(process.env.PORT || 5000)

    const server = fastify({
        logger: logger,
        disableRequestLogging: true,
    })

    server.register(staticMiddleware, {
        root: path.join(__dirname, '..', 'public'),
    })

    server.get('/', async (req, reply) => {
        return reply.sendFile('index.html') // serving path.join(__dirname, 'public', 'myHtml.html') directly
    })

    // server.get('/', async (_, reply) => {
    //     reply.sendFile('index.html', { cacheControl: false })
    // })

    server.get('/internal/is_alive', async () => {
        return { status: 'ok' }
    })

    server.get('/internal/is_ready', async () => {
        return { status: 'ok' }
    })

    server.get('/api/test', async () => {
        const data = await getTeamScoreTimeline()
        return data
    })

    await server.listen({ port: port, host: '0.0.0.0' })
}
