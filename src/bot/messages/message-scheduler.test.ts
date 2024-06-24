import { test, expect, mock } from 'bun:test'
import type { App } from '@slack/bolt'

import { cronJob } from './message-scheduler'

const fakeApp: App = {} as App

test('cron should not run when pod is not leader', async () => {
    mock.module('../../utils/leader.ts', () => ({
        isLeader: () => false,
    }))

    const result = await cronJob(fakeApp)
    expect(result).toBe('skipped')
})

test('cron should run when pod is leader', async () => {
    mock.module('../../utils/leader.ts', () => ({
        isLeader: () => true,
    }))

    mock.module('../../bot/messages/message-jobs.ts', () => ({
        askRelevantTeams: () => [],
        inspectForBrokenAsks: () => [],
        revealRelevantTeams: () => [],
    }))

    const result = await cronJob(fakeApp)

    expect(result).toBe('completed')
})
