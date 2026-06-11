import { test, expect, vi, describe } from 'vitest'
import type { App } from '@slack/bolt'

import type { Team } from '../../db/types'
import { defaultQuestions } from '../../questions/default'
import { questionsToJsonb } from '../../questions/jsonb-utils'
import { raise } from '../../utils/ts-utils'

import { askRelevantTeams, revealRelevantTeams } from './message-jobs'

type TeamQueries = { hasActiveAsk?: boolean; hasAskedToday?: boolean; hasActiveUnnaggedAsk?: boolean }
type TeamWithQueries = { team: Team; queries?: TeamQueries }

let _teams: TeamWithQueries[] = []
let _revealTeams: TeamWithQueries[] = []
let _mockDate: Date = new Date()

const { postToTeam, remindTeam, revealTeam } = vi.hoisted(() => ({
    postToTeam: vi.fn(() => void 0),
    remindTeam: vi.fn(() => void 0),
    revealTeam: vi.fn(() => void 0),
}))

vi.mock('../../utils/date', async (importActual) => {
    const actual = await importActual<typeof import('../../utils/date')>()
    return {
        ...actual,
        getNowInNorway: () => _mockDate,
    }
})

vi.mock('../../db/index.ts', () => ({
    getActiveTeams: () => _teams.map((it) => it.team),
    getTeamsToReveal: () => _revealTeams.map((it) => it.team),
    getBrokenAsks: () => [],
    deactivateTeam: () => void 0,
    hasActiveAsk: (id: string) => findTeam(id).queries?.hasActiveAsk ?? false,
    hasAskedToday: (id: string) => findTeam(id).queries?.hasAskedToday ?? false,
    hasActiveUnnaggedAsk: (id: string) => findTeam(id).queries?.hasActiveUnnaggedAsk ?? false,
}))

vi.mock('../../bot/messages/message-poster.ts', () => ({
    postToTeam,
    remindTeam,
    revealTeam,
}))

function findTeam(id: string): TeamWithQueries {
    return (
        _teams.find((it) => it.team.id === id) ??
        _revealTeams.find((it) => it.team.id === id) ??
        raise(new Error(`No team with id ${id} found`))
    )
}

const fakeApp: App = {} as App

describe('askRelevantTeams', () => {
    test('should handle no active teams', async () => {
        mockDb([], [])

        const askedTeams = await askRelevantTeams(fakeApp)

        expect(askedTeams).toBe(0)
    })

    test('should handle active team not needing to post today', async () => {
        mockDate(new Date('2023-05-04T10:00:00'))
        mockDb([{ team: createTeam() }], [])

        const askedTeams = await askRelevantTeams(fakeApp)

        expect(askedTeams).toBe(0)
    })

    test('should handle active team but has activeAsk', async () => {
        mockDate(new Date('2023-05-05T10:00:00'))
        mockDb([{ team: createTeam(), queries: { hasActiveAsk: true } }], [])

        const askedTeams = await askRelevantTeams(fakeApp)

        expect(askedTeams).toBe(0)
    })

    test('should handle active team but has already asked earlier today', async () => {
        mockDate(new Date('2023-05-05T10:00:00'))
        mockDb([{ team: createTeam(), queries: { hasAskedToday: true } }], [])

        const askedTeams = await askRelevantTeams(fakeApp)

        expect(askedTeams).toBe(0)
    })

    test('should handle active team needing to post today', async () => {
        mockDate(new Date('2023-05-05T10:00:00'))
        mockDb([{ team: createTeam() }], [])
        resetSlack()

        const askedTeams = await askRelevantTeams(fakeApp)

        expect(postToTeam).toHaveBeenCalledTimes(1)
        expect(askedTeams).toBe(1)
    })

    test('should handle multiple active team needing to post today', async () => {
        mockDate(new Date('2023-05-05T10:00:00'))
        mockDb(
            [
                { team: createTeam({ id: 'team-1' }) },
                { team: createTeam({ id: 'team-2' }) },
                { team: createTeam({ id: 'team-3' }) },
            ],
            [],
        )
        resetSlack()

        const askedTeams = await askRelevantTeams(fakeApp)

        expect(postToTeam).toHaveBeenCalledTimes(3)
        expect(askedTeams).toBe(3)
    })

    test('should handle multiple active team needing to post today, some who does not post today', async () => {
        mockDate(new Date('2023-05-05T10:00:00'))
        mockDb(
            [
                { team: createTeam({ id: 'team-1' }) },
                { team: createTeam({ id: 'team-2', postDay: 3 }) },
                { team: createTeam({ id: 'team-3', postDay: 5 }) },
            ],
            [],
        )
        resetSlack()

        const askedTeams = await askRelevantTeams(fakeApp)

        expect(askedTeams).toBe(1)
    })

    test('should not post to team whose frequency is off', async () => {
        mockDb(
            [
                {
                    team: createTeam({
                        // Wants to post 19th of May
                        frequency: 3,
                        weekSkew: 2,
                    }),
                },
            ],
            [],
        )

        mockDate(new Date('2023-05-05T11:37:00'))

        const askedTeams = await askRelevantTeams(fakeApp)

        expect(askedTeams).toBe(0)
    })

    test('should not post to team whose next post overflows to next year', async () => {
        mockDb(
            [
                {
                    team: createTeam({
                        postDay: 4,
                        postHour: 12,
                        frequency: 4,
                        weekSkew: 0,
                    }),
                },
            ],
            [],
        )

        mockDate(new Date('2023-12-29T13:37:00'))

        const askedTeams = await askRelevantTeams(fakeApp)

        expect(askedTeams).toBe(0)
    })
})

describe('revealRelevantTeams', () => {
    test('should handle no teams to reveal', async () => {
        mockDb([], [])

        const result = await revealRelevantTeams(fakeApp)

        expect(result.revealedTeams).toBe(0)
        expect(result.naggedTeams).toBe(0)
    })

    test('should handle team without active ask', async () => {
        mockDate(new Date('2023-05-05T12:00:00'))
        mockDb(
            [],
            [
                {
                    team: createTeam(),
                    queries: {
                        hasActiveAsk: false,
                        hasAskedToday: false,
                        hasActiveUnnaggedAsk: false,
                    },
                },
            ],
        )

        const result = await revealRelevantTeams(fakeApp)

        expect(result.revealedTeams).toBe(0)
        expect(result.naggedTeams).toBe(0)
    })

    test('should handle team with active ask', async () => {
        mockDate(new Date('2023-05-05T12:00:00'))
        mockDb(
            [],
            [
                {
                    team: createTeam(),
                    queries: {
                        hasActiveAsk: true,
                        hasAskedToday: false,
                        hasActiveUnnaggedAsk: false,
                    },
                },
            ],
        )
        resetSlack()

        const result = await revealRelevantTeams(fakeApp)

        expect(revealTeam).toHaveBeenCalledTimes(1)

        expect(result.revealedTeams).toBe(1)
        expect(result.naggedTeams).toBe(0)
    })

    test('should nag team when reveal less than an hour', async () => {
        mockDate(new Date('2023-05-05T11:00:00'))
        mockDb(
            [],
            [
                {
                    team: createTeam(),
                    queries: {
                        hasActiveAsk: false,
                        hasAskedToday: false,
                        hasActiveUnnaggedAsk: true,
                    },
                },
            ],
        )
        resetSlack()

        const result = await revealRelevantTeams(fakeApp)

        expect(remindTeam).toHaveBeenCalledTimes(1)

        expect(result.revealedTeams).toBe(0)
        expect(result.naggedTeams).toBe(1)
    })

    test('should nag and reveal team if both are required', async () => {
        mockDate(new Date('2023-05-05T11:00:00'))
        mockDb(
            [],
            [
                // Should nag
                {
                    team: createTeam({ id: 'team-1', name: 'Nag Team', revealHour: 12 }),
                    queries: { hasActiveUnnaggedAsk: true, hasActiveAsk: false },
                },
                // Should reveal
                {
                    team: createTeam({ id: 'team-2', name: 'Reveal team', revealHour: 11 }),
                    queries: { hasActiveUnnaggedAsk: false, hasActiveAsk: true },
                },
            ],
        )
        resetSlack()

        const result = await revealRelevantTeams(fakeApp)

        expect(revealTeam).toHaveBeenCalledTimes(1)
        expect(remindTeam).toHaveBeenCalledTimes(1)

        expect(result.revealedTeams).toBe(1)
        expect(result.naggedTeams).toBe(1)
    })
})

function mockDb(teams: TeamWithQueries[], revealTeams: TeamWithQueries[]): void {
    _teams = teams
    _revealTeams = revealTeams
}

function mockDate(date: Date): void {
    _mockDate = date
}

function resetSlack(): void {
    postToTeam.mockReset()
    remindTeam.mockReset()
    revealTeam.mockReset()
}

function createTeam(overrides?: Partial<Team>): Team {
    return {
        id: 'ABC',
        revealDay: 4,
        revealHour: 12,
        postDay: 4,
        postHour: 10,
        frequency: 1,
        weekSkew: 0,
        active: true,
        questions: questionsToJsonb(defaultQuestions()),
        name: 'Test Team',
        assosiatedGroup: null,
        ...overrides,
    }
}
