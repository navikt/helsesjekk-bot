import { schedule } from 'node-cron'

import { App } from '../app'
import { isLeader } from '../../utils/leader'

import { askRelevantTeams, inspectForBrokenAsks, revealRelevantTeams } from './message-jobs'

export function configureMessageScheduler(app: App): void {
    const EVERY_5TH_MINUTE = '*/5 * * * *'

    schedule(EVERY_5TH_MINUTE, () => cronJob(app))
}

export async function cronJob(
    app: App,
): Promise<
    'skipped' | 'completed' | { partialError: { ask: Error | null; reveal: Error | null; inspect: Error | null } }
> {
    console.info('Running scheduled job, checking for messages to post')

    const jobsResult = {
        ask: null,
        reveal: null,
        inspect: null,
    }

    try {
        await askRelevantTeams(app)
        jobsResult.ask = 'completed'
    } catch (e) {
        jobsResult.ask = e
        console.error(new Error('Error occured during team ask', { cause: e }))
    }

    try {
        await revealRelevantTeams(app)
        jobsResult.reveal = 'completed'
    } catch (e) {
        jobsResult.reveal = e
        console.error(new Error('Error occured during team reveal', { cause: e }))
    }

    try {
        await inspectForBrokenAsks()
        jobsResult.inspect = 'completed'
    } catch (e) {
        jobsResult.inspect = e
        console.error(new Error('Scheduled job failed at dirty check', { cause: e }))
    }

    if (jobsResult.ask === 'completed' && jobsResult.reveal === 'completed' && jobsResult.inspect === 'completed') {
        console.info('Scheduled job completed successfully')
        return 'completed'
    } else {
        console.error(new Error('Scheduled job failed', { cause: jobsResult }))
        return { partialError: jobsResult }
    }
}
