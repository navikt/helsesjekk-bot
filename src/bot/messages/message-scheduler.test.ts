import { test, expect, vi } from 'vitest'
import type { App } from '@slack/bolt'

let _isLeader = false

vi.mock('../../utils/leader.ts', () => ({
    isLeader: () => _isLeader,
}))

vi.mock('../../bot/messages/message-jobs.ts', () => ({
    askRelevantTeams: () => [],
    inspectForBrokenAsks: () => [],
    revealRelevantTeams: () => [],
}))

import { cronJob } from './message-scheduler'

const fakeApp: App = {} as App

test('cron should not run when pod is not leader', async () => {
    _isLeader = false

    const result = await cronJob(fakeApp)
    expect(result).toBe('skipped')
})

test('cron should run when pod is leader', async () => {
    _isLeader = true

    const result = await cronJob(fakeApp)

    expect(result).toBe('completed')
})
