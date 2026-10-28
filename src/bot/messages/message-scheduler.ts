import { logger } from '@navikt/next-logger'
import { schedule } from 'node-cron'

import { isLeader } from '../../utils/leader'
import { App } from '../app'

import { askRelevantTeams, inspectForBrokenAsks, revealRelevantTeams } from './message-jobs'

export const cronLogger = logger.child(
    { x_context: 'cron-job' },
    { level: process.env.NODE_ENV === 'test' ? 'error' : undefined },
)

export function configureMessageScheduler(app: App): void {
    const EVERY_5TH_MINUTE = '*/5 * * * *'

    schedule(EVERY_5TH_MINUTE, () => cronJob(app))
}

export async function cronJob(
    app: App,
): Promise<
    | 'skipped'
    | 'completed'
    | { partialError: { ask: string | Error | null; reveal: string | Error | null; inspect: string | Error | null } }
> {
    try {
        const isPodLeader = await isLeader()
        if (!isPodLeader) {
            cronLogger.info('Not the pod leader, skipping scheduled job')
            return 'skipped'
        }
    } catch (e) {
        logger.error(new Error('Failed to check if pod is leader', { cause: e }))
        throw e
    }

    cronLogger.info('Running scheduled job, checking for messages to post')

    const jobsResult: {
        ask: string | Error | null
        reveal: string | Error | null
        inspect: string | Error | null
    } = {
        ask: null,
        reveal: null,
        inspect: null,
    }

    try {
        await askRelevantTeams(app)
        jobsResult.ask = 'completed'
    } catch (e) {
        jobsResult.ask = e as Error
        cronLogger.error(new Error('Error occured during team ask', { cause: e }))
    }

    try {
        await revealRelevantTeams(app)
        jobsResult.reveal = 'completed'
    } catch (e) {
        jobsResult.reveal = e as Error
        cronLogger.error(new Error('Error occured during team reveal', { cause: e }))
    }

    try {
        await inspectForBrokenAsks()
        jobsResult.inspect = 'completed'
    } catch (e) {
        jobsResult.inspect = e as Error
        cronLogger.error(new Error('Scheduled job failed at dirty check', { cause: e }))
    }

    if (jobsResult.ask === 'completed' && jobsResult.reveal === 'completed' && jobsResult.inspect === 'completed') {
        cronLogger.info('Scheduled job completed successfully')
        return 'completed'
    } else {
        cronLogger.error(new Error('Scheduled job failed', { cause: jobsResult }))
        return { partialError: jobsResult }
    }
}
