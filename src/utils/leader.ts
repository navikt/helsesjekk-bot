import * as os from 'node:os'

import { logger } from '@navikt/next-logger'

export async function isLeader(): Promise<boolean> {
    if (process.env.NODE_ENV !== 'production') return true

    const hostname = os.hostname()
    const electorPath = process.env.ELECTOR_PATH
    if (!electorPath) {
        throw new Error('Missing env var ELECTOR_PATH, are you sure you enabled leader election in nais.yml?')
    }

    logger.info(`Checking if pod (${hostname}) is leader on ${electorPath}`)
    const electorResponse = await fetch(`http://${electorPath}`, { cache: 'no-store' })
    if (!electorResponse.ok) {
        throw new Error(
            `Failed to fetch leader from ${electorPath}, response: ${electorResponse.status} ${electorResponse.statusText}`,
        )
    }
    const result: { name: string; last_update: string } = await electorResponse.json()

    logger.info(`Is this pod (${hostname}) leader? Leader election says: ${JSON.stringify(result)}`)

    return result.name === hostname
}
