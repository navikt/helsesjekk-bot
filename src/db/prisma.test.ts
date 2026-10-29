import { logger } from '@navikt/next-logger'
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { subDays, subWeeks, subYears } from 'date-fns'
import { sql } from 'drizzle-orm'
import { expect, beforeAll, afterAll, beforeEach, describe, test, vi, type Mock } from 'vitest'

import { testQuestions } from '../../tests/data'
import type { App } from '../bot/app'
import { createScoreBlocks } from '../bot/messages/message-builder'
import { revealTeam } from '../bot/messages/message-poster'
import { questionsFromJsonb, questionsToJsonb } from '../questions/jsonb-utils'
import { QuestionType } from '../safe-types'

import { adminGetTeamsWithAsked } from './admin'
import { answerQuestions, getAnswer } from './answer'
import {
    createAsked,
    deleteAsked,
    getActiveAsk,
    getAsked,
    getPreviousAsk,
    hasActiveAsk,
    hasActiveUnnaggedAsk,
    hasAskedToday,
    markAskedAsNagged,
    markAskedRevealed,
} from './asked'
import { drizzle } from './drizzle/db'
import { migrateDb } from './drizzle/migrate'
import * as schema from './drizzle/schema'
import { getGlobalScoreTimeline, getTeamScorePerQuestion, getTeamScoreTimeline, getTeamsScoredAsks } from './score'
import { funStats } from './stats'
import {
    addQuestionToTeam,
    createTeam,
    deactivateTeam,
    deleteQuestionFromTeam,
    getActiveTeams,
    getBrokenAsks,
    getTeam,
    getTeamByAdGroupAndTeamId,
    getTeamById,
    getTeamsByAdGroups,
    getTeamsToReveal,
    reactivateTeam,
    setAskTime,
    setRevealTime,
    setTeamFrequency,
    setTeamName,
    setTeamStatus,
    teamStatus,
    toggleQuestionRequiredInTeam,
    updateTeam,
    updateTeamGroupAssociation,
} from './team'
import { AnswerLevel, type Asked, Day, QuestionAnswer } from './types'

vi.mock('../bot/messages/message-builder', async (importActual) => {
    const actual = await importActual<typeof import('../bot/messages/message-builder')>()
    return { ...actual, createScoreBlocks: vi.fn<typeof actual.createScoreBlocks>(actual.createScoreBlocks) }
})

/**
 * These tests verify how the prisma database wrapper function operate today.
 *
 * They will later be executed against the drizzle implementation to verify that all the data,
 * joins and relations are working as expected.
 *
 * Seeding and cleanup is done directly with drizzle, so that the setup is independent of the
 * implementation being verified.
 */
describe('prisma → drizzle database verification tests', async () => {
    let container: StartedPostgreSqlContainer | null = null

    beforeAll(async () => {
        container = await new PostgreSqlContainer('postgres:18-alpine')
            .withDatabase('helsesjekk-bot')
            .start()
            .then(async (it) => {
                logger.info(`Postgres started!`)

                process.env.NAIS_DATABASE_HELSESJEKK_BOT_HELSESJEKK_BOT_URL = it.getConnectionUri()

                /**
                 * Because its easier and because prisma sucks, we'll run drizzles
                 * migrations, prisma will work with the tables anyway
                 */
                await migrateDb()

                return it
            })
    }, 120_000)

    afterAll(async () => {
        await drizzle().$client.end()
        await container?.stop()
    })

    beforeEach(async () => {
        await drizzle().execute(sql`TRUNCATE "Answer", "Asked", "Team" RESTART IDENTITY CASCADE`)
    })

    describe('team', () => {
        test('createTeam creates a team with defaults', async () => {
            const team = await createTeam('C1', 'Team One')

            expect(team).toMatchObject({
                id: 'C1',
                name: 'Team One',
                active: true,
                postDay: Day.FRIDAY,
                postHour: 14,
                revealDay: Day.MONDAY,
                revealHour: 10,
                assosiatedGroup: null,
                frequency: 1,
                weekSkew: 0,
            })
            expect(questionsFromJsonb(team.questions).length).toBeGreaterThan(0)

            expect(await getTeam('C1')).toEqual(team)
            expect(await getTeamById('C1')).toEqual(team)
        })

        test('createTeam fails on duplicate id', async () => {
            await createTeam('C1', 'Team One')
            await expect(createTeam('C1', 'Team One again')).rejects.toThrow(Error)
        })

        test('teamStatus returns NEW, ACTIVE and DEACTIVATED', async () => {
            expect(await teamStatus('C1')).toBe('NEW')
            await createTeam('C1', 'Team One')
            expect(await teamStatus('C1')).toBe('ACTIVE')
            await deactivateTeam('C1')
            expect(await teamStatus('C1')).toBe('DEACTIVATED')
            await reactivateTeam('C1')
            expect(await teamStatus('C1')).toBe('ACTIVE')
        })

        test('getTeamsByAdGroups returns only teams in the given groups', async () => {
            await seedTeam({ id: 'C1', assosiatedGroup: 'group-a' })
            await seedTeam({ id: 'C2', assosiatedGroup: 'group-b' })
            await seedTeam({ id: 'C3', assosiatedGroup: null })

            const teams = await getTeamsByAdGroups(['group-a', 'group-b', 'group-c'])
            expect(ids(teams ?? [])).toEqual(['C1', 'C2'])

            expect(await getTeamsByAdGroups([])).toEqual([])
            expect(await getTeamsByAdGroups(['nope'])).toEqual([])
        })

        test('getTeamByAdGroupAndTeamId matches group with contains and exposes active ask ts', async () => {
            await seedTeam({ id: 'C1', assosiatedGroup: 'prefix-group-a-suffix' })
            await seedTeam({ id: 'C2', assosiatedGroup: null })

            expect(await getTeamByAdGroupAndTeamId('group-b', 'C1')).toBeNull()
            expect(await getTeamByAdGroupAndTeamId('group-a', 'C2')).toBeNull()

            const withoutAsk = await getTeamByAdGroupAndTeamId('group-a', 'C1')
            expect(withoutAsk).toMatchObject({ id: 'C1', activeAskTs: null })

            await seedAsked({ teamId: 'C1', messageTs: 'revealed', revealed: true })
            await seedAsked({ teamId: 'C1', messageTs: 'skipped', revealed: false, skipped: true })
            expect((await getTeamByAdGroupAndTeamId('group-a', 'C1'))?.activeAskTs).toBeNull()

            await seedAsked({ teamId: 'C1', messageTs: 'active-ts', revealed: false })
            const withAsk = await getTeamByAdGroupAndTeamId('group-a', 'C1')
            expect(withAsk?.activeAskTs).toBe('active-ts')
            expect(withAsk).not.toHaveProperty('Asked', undefined)
        })

        test('updateTeamGroupAssociation sets group', async () => {
            await seedTeam({ id: 'C1' })
            const team = await updateTeamGroupAssociation('C1', 'group-x')
            expect(team.assosiatedGroup).toBe('group-x')
            expect((await getTeam('C1'))?.assosiatedGroup).toBe('group-x')
        })

        test('updateTeam without a new question keeps questions', async () => {
            await seedTeam({ id: 'C1' })

            const team = await updateTeam(
                'C1',
                { name: 'New name', active: false, postDay: 1, postHour: 9, revealDay: 2, revealHour: 11 },
                null,
            )

            expect(team).toMatchObject({
                id: 'C1',
                name: 'New name',
                active: false,
                postDay: 1,
                postHour: 9,
                revealDay: 2,
                revealHour: 11,
            })
            expect(questionsFromJsonb(team.questions)).toEqual(testQuestions)
            expect(await getTeam('C1')).toEqual(team)
        })

        test('updateTeam with a new question appends it', async () => {
            await seedTeam({ id: 'C1' })

            const team = await updateTeam(
                'C1',
                { name: 'Team', active: true, postDay: 0, postHour: 8, revealDay: 0, revealHour: 12 },
                { question: 'New?', high: 'H', mid: 'M', low: 'L', category: QuestionType.SPEED },
            )

            const questions = questionsFromJsonb(team.questions)
            expect(questions).toHaveLength(testQuestions.length + 1)
            expect(questions.slice(0, testQuestions.length)).toEqual(testQuestions)
            expect(questions.at(-1)).toEqual({
                questionId: expect.any(String),
                question: 'New?',
                answers: { LOW: 'L', MID: 'M', HIGH: 'H' },
                type: QuestionType.SPEED,
                custom: true,
            })
        })

        test('updateTeam throws for unknown team', async () => {
            await expect(
                updateTeam(
                    'nope',
                    { name: 'x', active: true, postDay: 0, postHour: 0, revealDay: 0, revealHour: 0 },
                    null,
                ),
            ).rejects.toThrow(Error)
        })

        test('deleteQuestionFromTeam removes only the given question', async () => {
            await seedTeam({ id: 'C1' })

            const team = await deleteQuestionFromTeam('C1', 'question-2')

            expect(questionsFromJsonb(team.questions).map((it) => it.questionId)).toEqual([
                'question-1',
                'question-3',
                'question-4',
            ])
            expect(await getTeam('C1')).toEqual(team)

            const unchanged = await deleteQuestionFromTeam('C1', 'does-not-exist')
            expect(unchanged.questions).toEqual(team.questions)
        })

        test('toggleQuestionRequiredInTeam sets required on given question', async () => {
            await seedTeam({ id: 'C1' })

            const team = await toggleQuestionRequiredInTeam('C1', 'question-1', false)
            const questions = questionsFromJsonb(team.questions)

            expect(questions[0]).toEqual({ ...testQuestions[0], required: false })
            expect(questions.slice(1)).toEqual(testQuestions.slice(1))

            const toggledBack = await toggleQuestionRequiredInTeam('C1', 'question-4', true)
            expect(questionsFromJsonb(toggledBack.questions)[3].required).toBe(true)
        })

        test('addQuestionToTeam appends a question with required flag', async () => {
            await seedTeam({ id: 'C1' })

            const team = await addQuestionToTeam('C1', {
                question: 'Added?',
                type: QuestionType.TECH,
                high: 'H',
                mid: 'M',
                low: 'L',
                required: false,
            })

            const questions = questionsFromJsonb(team.questions)
            expect(questions).toHaveLength(testQuestions.length + 1)
            expect(questions.at(-1)).toEqual({
                questionId: expect.any(String),
                question: 'Added?',
                answers: { LOW: 'L', MID: 'M', HIGH: 'H' },
                type: QuestionType.TECH,
                required: false,
                custom: true,
            })

            await expect(
                addQuestionToTeam('nope', { question: 'x', type: 'TECH', high: '', mid: '', low: '', required: true }),
            ).rejects.toThrow('Team with id nope not found')
        })

        test('simple setters update the expected columns', async () => {
            await seedTeam({ id: 'C1' })

            expect((await setTeamName('C1', 'Renamed')).name).toBe('Renamed')
            expect(await setRevealTime('C1', 15, Day.THURSDAY)).toMatchObject({ revealHour: 15, revealDay: 3 })
            expect(await setAskTime('C1', 7, Day.TUESDAY)).toMatchObject({ postHour: 7, postDay: 1 })
            expect(await setTeamFrequency('C1', 2, 1)).toMatchObject({ frequency: 2, weekSkew: 1 })

            expect(await getTeam('C1')).toMatchObject({
                name: 'Renamed',
                revealHour: 15,
                revealDay: 3,
                postHour: 7,
                postDay: 1,
                frequency: 2,
                weekSkew: 1,
            })
        })

        test('setters throw for unknown team', async () => {
            await expect(setTeamName('nope', 'x')).rejects.toThrow(Error)
            await expect(setTeamFrequency('nope', 1, 0)).rejects.toThrow(Error)
        })

        test('setTeamStatus(false) deactivates and skips the active ask', async () => {
            await seedTeam({ id: 'C1' })
            const ask = await seedAsked({ teamId: 'C1', revealed: false, nagged: false })

            const team = await setTeamStatus('C1', false)
            expect(team.active).toBe(false)

            expect(await getAskedRow(ask.id)).toMatchObject({ revealed: true, nagged: true, skipped: true })

            expect((await setTeamStatus('C1', true)).active).toBe(true)
        })

        test('deactivateTeam without an active ask only deactivates', async () => {
            await seedTeam({ id: 'C1' })
            const ask = await seedAsked({ teamId: 'C1', revealed: true })

            const team = await deactivateTeam('C1')
            expect(team.active).toBe(false)
            expect(await getAskedRow(ask.id)).toMatchObject({ revealed: true, nagged: false, skipped: false })
        })

        test('getActiveTeams only returns active teams', async () => {
            await seedTeam({ id: 'C1', active: true })
            await seedTeam({ id: 'C2', active: false })
            await seedTeam({ id: 'C3', active: true })

            expect(ids(await getActiveTeams())).toEqual(['C1', 'C3'])
        })

        test('getTeamsToReveal returns active teams with an unrevealed, unskipped ask', async () => {
            await seedTeam({ id: 'with-active-ask' })
            await seedAsked({ teamId: 'with-active-ask', revealed: false })
            await seedAsked({ teamId: 'with-active-ask', revealed: true })

            await seedTeam({ id: 'inactive-with-ask', active: false })
            await seedAsked({ teamId: 'inactive-with-ask', revealed: false })

            await seedTeam({ id: 'only-revealed' })
            await seedAsked({ teamId: 'only-revealed', revealed: true })

            await seedTeam({ id: 'only-skipped' })
            await seedAsked({ teamId: 'only-skipped', revealed: false, skipped: true })

            await seedTeam({ id: 'no-asks' })

            const teams = await getTeamsToReveal()
            expect(ids(teams)).toEqual(['with-active-ask'])
            // No relations are included
            expect(teams[0]).not.toHaveProperty('Asked')
        })

        test('getBrokenAsks returns asks that are skipped but not revealed', async () => {
            await seedTeam({ id: 'C1' })
            const broken = await seedAsked({ teamId: 'C1', revealed: false, skipped: true })
            await seedAsked({ teamId: 'C1', revealed: true, skipped: true })
            await seedAsked({ teamId: 'C1', revealed: false, skipped: false })

            const asks = await getBrokenAsks()
            expect(asks).toHaveLength(1)
            expect(asks[0]).toEqual(broken)
        })
    })

    describe('asked', () => {
        test('createAsked creates an unrevealed ask with current timestamp', async () => {
            await seedTeam({ id: 'C1' })
            const before = new Date()

            const asked = await createAsked('ts-1', 'C1', testQuestions)

            expect(asked).toEqual({
                id: expect.any(Number),
                teamId: 'C1',
                messageTs: 'ts-1',
                timestamp: expect.any(Date),
                questions: questionsToJsonb(testQuestions),
                revealed: false,
                nagged: false,
                skipped: false,
            })
            expect(asked.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000)
        })

        test('createAsked fails for unknown team (foreign key)', async () => {
            await expect(createAsked('ts-1', 'nope', testQuestions)).rejects.toThrow(Error)
        })

        test('getAsked finds by channel and ts', async () => {
            await seedTeam({ id: 'C1' })
            await seedTeam({ id: 'C2' })
            const asked = await createAsked('ts-1', 'C1', testQuestions)

            expect(await getAsked('C1', 'ts-1')).toEqual(asked)
            expect(await getAsked('C2', 'ts-1')).toBeNull()
            expect(await getAsked('C1', 'ts-2')).toBeNull()
        })

        test('hasActiveAsk / getActiveAsk', async () => {
            await seedTeam({ id: 'C1' })
            expect(await hasActiveAsk('C1')).toBe(false)
            expect(await getActiveAsk('C1')).toBeNull()

            await seedAsked({ teamId: 'C1', revealed: true })
            await seedAsked({ teamId: 'C1', revealed: false, skipped: true })
            expect(await hasActiveAsk('C1')).toBe(false)
            expect(await getActiveAsk('C1')).toBeNull()

            const active = await seedAsked({ teamId: 'C1', revealed: false })
            await seedAnswer({ askedId: active.id, userId: 'U1' })
            await seedAnswer({ askedId: active.id, userId: 'U2' })

            expect(await hasActiveAsk('C1')).toBe(true)
            const activeAsk = await getActiveAsk('C1')
            expect(activeAsk).toMatchObject({ ...active, answers: expect.any(Array) })
            expect(activeAsk?.answers.map((it) => it.userId).sort()).toEqual(['U1', 'U2'])
            expect(activeAsk?.answers[0]).toEqual({
                askedId: active.id,
                userId: expect.any(String),
                answeredAt: expect.any(Date),
                answers: expect.any(Array),
            })
        })

        test('hasAskedToday only considers asks from start of today', async () => {
            await seedTeam({ id: 'C1' })
            await seedAsked({ teamId: 'C1', timestamp: subDays(new Date(), 2) })
            expect(await hasAskedToday('C1')).toBe(false)

            await seedAsked({ teamId: 'C1', timestamp: new Date() })
            expect(await hasAskedToday('C1')).toBe(true)
            expect(await hasAskedToday('C2')).toBe(false)
        })

        test('hasActiveUnnaggedAsk ignores skipped flag but respects revealed and nagged', async () => {
            await seedTeam({ id: 'C1' })
            await seedAsked({ teamId: 'C1', revealed: true, nagged: false })
            await seedAsked({ teamId: 'C1', revealed: false, nagged: true })
            expect(await hasActiveUnnaggedAsk('C1')).toBe(false)

            await seedTeam({ id: 'C2' })
            await seedAsked({ teamId: 'C2', revealed: false, nagged: false, skipped: true })
            expect(await hasActiveUnnaggedAsk('C2')).toBe(true)
        })

        test('markAskedAsNagged and markAskedRevealed', async () => {
            await seedTeam({ id: 'C1' })
            const ask = await seedAsked({ teamId: 'C1' })

            await markAskedAsNagged(ask.id)
            expect(await getAskedRow(ask.id)).toMatchObject({ nagged: true, revealed: false, skipped: false })

            await markAskedRevealed(ask.id)
            expect(await getAskedRow(ask.id)).toMatchObject({ nagged: true, revealed: true, skipped: false })

            const other = await seedAsked({ teamId: 'C1' })
            await markAskedRevealed(other.id, true)
            expect(await getAskedRow(other.id)).toMatchObject({ revealed: true, skipped: true })

            await expect(markAskedRevealed(9999)).rejects.toThrow(Error)
            await expect(markAskedAsNagged(9999)).rejects.toThrow(Error)
        })

        test('getPreviousAsk returns latest revealed, non-skipped ask other than the given one', async () => {
            await seedTeam({ id: 'C1' })
            await seedTeam({ id: 'C2' })

            const oldest = await seedAsked({ teamId: 'C1', revealed: true, timestamp: subWeeks(new Date(), 3) })
            const previous = await seedAsked({ teamId: 'C1', revealed: true, timestamp: subWeeks(new Date(), 2) })
            await seedAsked({ teamId: 'C1', revealed: true, skipped: true, timestamp: subWeeks(new Date(), 1) })
            await seedAsked({ teamId: 'C2', revealed: true, timestamp: subDays(new Date(), 1) })
            const current = await seedAsked({ teamId: 'C1', revealed: true, timestamp: new Date() })
            await seedAnswer({ askedId: previous.id, userId: 'U1' })

            const result = await getPreviousAsk(current)
            expect(result).toEqual({ ...previous, answers: [expect.objectContaining({ userId: 'U1' })] })

            const beforeThat = await getPreviousAsk(previous)
            expect(beforeThat?.id).toBe(current.id)

            await deleteAsked(current.id)
            await deleteAsked(previous.id)
            expect(await getPreviousAsk(oldest)).toBeNull()
        })

        test('deleteAsked removes the ask and its answers', async () => {
            await seedTeam({ id: 'C1' })
            const ask = await seedAsked({ teamId: 'C1' })
            const other = await seedAsked({ teamId: 'C1' })
            await seedAnswer({ askedId: ask.id, userId: 'U1' })
            await seedAnswer({ askedId: other.id, userId: 'U1' })

            await deleteAsked(ask.id)

            expect(await getAskedRow(ask.id)).toBeUndefined()
            expect(await getAnswer('U1', ask.id)).toBeNull()
            expect(await getAnswer('U1', other.id)).not.toBeNull()
            await expect(deleteAsked(ask.id)).rejects.toThrow(Error)
        })
    })

    describe('answer', () => {
        test('answerQuestions creates then updates (upsert) an answer', async () => {
            await seedTeam({ id: 'C1' })
            const asked = await createAsked('ts-1', 'C1', testQuestions)

            await answerQuestions(
                asked,
                [
                    ['question-1', AnswerLevel.GOOD],
                    ['question-2', AnswerLevel.BAD],
                ],
                'U1',
            )

            const first = await getAnswer('U1', asked.id)
            expect(first).toEqual({
                userId: 'U1',
                askedId: asked.id,
                answeredAt: expect.any(Date),
                answers: [
                    { questionId: 'question-1', answer: 'GOOD', type: QuestionType.TEAM_HEALTH },
                    { questionId: 'question-2', answer: 'BAD', type: QuestionType.SPEED },
                ],
            })

            await answerQuestions(asked, [['question-3', AnswerLevel.MEDIUM]], 'U1')

            const second = await getAnswer('U1', asked.id)
            expect(second).toEqual({
                userId: 'U1',
                askedId: asked.id,
                // answeredAt is not changed on update
                answeredAt: first?.answeredAt,
                answers: [{ questionId: 'question-3', answer: 'MEDIUM', type: QuestionType.TECH }],
            })

            const rows = await drizzle().select().from(schema.answer)
            expect(rows).toHaveLength(1)
        })

        test('answerQuestions throws for unknown question id', async () => {
            await seedTeam({ id: 'C1' })
            const asked = await createAsked('ts-1', 'C1', testQuestions)

            await expect(answerQuestions(asked, [['nope', AnswerLevel.GOOD]], 'U1')).rejects.toThrow(
                'Unable to find question with id nope',
            )
        })

        test('getAnswer returns null when not found', async () => {
            expect(await getAnswer('U1', 1)).toBeNull()
        })
    })

    describe('admin', () => {
        test('adminGetTeamsWithAsked includes selected asked fields and answer count', async () => {
            await seedTeam({ id: 'C1' })
            await seedTeam({ id: 'C2' })
            const ask = await seedAsked({ teamId: 'C1', messageTs: 'ts-1', nagged: true })
            const ask2 = await seedAsked({ teamId: 'C1', messageTs: 'ts-2' })
            await seedAnswer({ askedId: ask.id, userId: 'U1' })
            await seedAnswer({ askedId: ask.id, userId: 'U2' })

            const result = byId(await adminGetTeamsWithAsked())

            expect(result).toHaveLength(2)
            expect(result[0]).toMatchObject({ id: 'C1', name: 'Team C1', active: true })
            expect([...result[0].Asked].sort((a, b) => a.id - b.id)).toEqual([
                {
                    id: ask.id,
                    messageTs: 'ts-1',
                    nagged: true,
                    skipped: false,
                    revealed: false,
                    questions: questionsToJsonb(ASK_QUESTIONS),
                    _count: { answers: 2 },
                },
                {
                    id: ask2.id,
                    messageTs: 'ts-2',
                    nagged: false,
                    skipped: false,
                    revealed: false,
                    questions: questionsToJsonb(ASK_QUESTIONS),
                    _count: { answers: 0 },
                },
            ])
            expect(result[1]).toMatchObject({ id: 'C2', Asked: [] })
        })
    })

    describe('stats', () => {
        test('funStats on empty database', async () => {
            expect(await funStats()).toEqual({
                activeTeams: 0,
                totalAsks: 0,
                totalAnswers: 0,
                biggestTeam: -1,
                dashboardTeams: 0,
                mostQuestions: -1,
            })
        })

        test('funStats aggregates across tables', async () => {
            await seedTeam({ id: 'C1', assosiatedGroup: 'g' })
            await seedTeam({ id: 'C2' })
            await seedTeam({ id: 'C3', active: false, assosiatedGroup: 'g' })
            await seedTeam({ id: 'C4', questions: [...testQuestions, ...testQuestions] })

            const a1 = await seedAsked({ teamId: 'C1', revealed: true })
            const a2 = await seedAsked({ teamId: 'C2', revealed: true })
            const skipped = await seedAsked({ teamId: 'C2', revealed: true, skipped: true })
            const active = await seedAsked({ teamId: 'C2', revealed: false })

            await seedAnswer({ askedId: a1.id, userId: 'U1' })
            await seedAnswer({ askedId: a1.id, userId: 'U2' })
            await seedAnswer({ askedId: a2.id, userId: 'U1' })
            await seedAnswer({ askedId: skipped.id, userId: 'U1' })
            await seedAnswer({ askedId: active.id, userId: 'U1' })
            await seedAnswer({ askedId: active.id, userId: 'U2' })
            await seedAnswer({ askedId: active.id, userId: 'U3' })

            expect(await funStats()).toEqual({
                activeTeams: 3,
                totalAsks: 2,
                totalAnswers: 3,
                // Counts across all asks, regardless of status
                biggestTeam: 3,
                dashboardTeams: 1,
                mostQuestions: testQuestions.length * 2,
            })
        })
    })

    describe('score', () => {
        const G = AnswerLevel.GOOD
        const M = AnswerLevel.MEDIUM
        const B = AnswerLevel.BAD

        test('getTeamScoreTimeline errors', async () => {
            expect(await getTeamScoreTimeline('nope')).toEqual({ error: 'Fant ikke ditt team' })

            await seedTeam({ id: 'C1' })
            await seedAsked({ teamId: 'C1', revealed: false })
            await seedAsked({ teamId: 'C1', revealed: true, skipped: true })
            expect(await getTeamScoreTimeline('C1')).toEqual({ error: 'Teamet ditt har ingen spørringer enda.' })
        })

        test('getTeamScoreTimeline sorts by timestamp and filters asks without answers', async () => {
            await seedTeam({ id: 'C1' })
            const newer = await seedAsked({ teamId: 'C1', revealed: true, timestamp: subWeeks(new Date(), 1) })
            const older = await seedAsked({ teamId: 'C1', revealed: true, timestamp: subWeeks(new Date(), 2) })
            await seedAsked({ teamId: 'C1', revealed: true, timestamp: subWeeks(new Date(), 3) })
            const skipped = await seedAsked({ teamId: 'C1', revealed: true, skipped: true })
            const unrevealed = await seedAsked({ teamId: 'C1', revealed: false })

            await seedAnswers(newer.id, 3, [G, G, G])
            await seedAnswers(older.id, 4, [G, M, B])
            await seedAnswer({ askedId: skipped.id, userId: 'U1', levels: [B, B, B] })
            await seedAnswer({ askedId: unrevealed.id, userId: 'U1', levels: [B, B, B] })

            const result = await getTeamScoreTimeline('C1')
            if ('error' in result) throw new Error(result.error)

            expect(result).toHaveLength(2)
            expect(result[0]).toEqual({ timestamp: older.timestamp, score: expect.any(Number), answers: 4 })
            expect(result[0].score.toFixed(2)).toEqual('2.83')
            expect(result[1]).toEqual({ timestamp: newer.timestamp, score: 5, answers: 3 })
        })

        test('getTeamScorePerQuestion groups scoring per question over time', async () => {
            expect(await getTeamScorePerQuestion('nope')).toEqual({ error: 'Fant ikke ditt team' })

            await seedTeam({ id: 'C1', questions: testQuestions.filter((it) => it.questionId !== 'question-3') })
            expect(await getTeamScorePerQuestion('C1')).toEqual({ error: 'Teamet ditt har ingen spørringer enda.' })

            const first = await seedAsked({ teamId: 'C1', revealed: true, timestamp: subWeeks(new Date(), 2) })
            const second = await seedAsked({ teamId: 'C1', revealed: true, timestamp: subWeeks(new Date(), 1) })
            await seedAnswers(second.id, 3, [G, G, G])
            await seedAnswers(first.id, 3, [G, M, B])

            const result = await getTeamScorePerQuestion('C1')
            if ('error' in result) throw new Error(result.error)

            const sorted = [...result].sort((a, b) => a.question.questionId.localeCompare(b.question.questionId))
            expect(sorted.map((it) => [it.question.questionId, it.question.isCurrent])).toEqual([
                ['question-1', true],
                ['question-2', true],
                ['question-3', false],
            ])

            const q2 = sorted[1]
            expect(q2.question).toEqual({
                questionId: 'question-2',
                question: 'How was your day?',
                answers: { GOOD: 'Good', MEDIUM: 'Okay', BAD: 'Bad' },
                isCurrent: true,
            })
            expect(q2.scoring).toEqual([
                { timestamp: first.timestamp, averageScore: 2.5, distribution: { GOOD: 0, MEDIUM: 3, BAD: 0 } },
                { timestamp: second.timestamp, averageScore: 5, distribution: { GOOD: 3, MEDIUM: 0, BAD: 0 } },
            ])
        })

        test('getTeamsScoredAsks only includes asks with at least 3 answers, newest first', async () => {
            await seedTeam({ id: 'C1' })
            await seedTeam({ id: 'C2' })

            const older = await seedAsked({ teamId: 'C1', revealed: true, timestamp: subWeeks(new Date(), 2) })
            const newer = await seedAsked({ teamId: 'C1', revealed: true, timestamp: subWeeks(new Date(), 1) })
            const tooFew = await seedAsked({ teamId: 'C1', revealed: true })
            const skipped = await seedAsked({ teamId: 'C1', revealed: true, skipped: true })
            const otherTeam = await seedAsked({ teamId: 'C2', revealed: true })

            for (const ask of [older, newer, skipped, otherTeam]) {
                await seedAnswer({ askedId: ask.id, userId: 'U1', levels: [G, G, G] })
                await seedAnswer({ askedId: ask.id, userId: 'U2', levels: [G, G, G] })
                await seedAnswer({ askedId: ask.id, userId: 'U3', levels: [B, B, B] })
            }
            await seedAnswer({ askedId: tooFew.id, userId: 'U1' })
            await seedAnswer({ askedId: tooFew.id, userId: 'U2' })

            const result = await getTeamsScoredAsks('C1')
            expect(result.map((it) => it.timestamp)).toEqual([newer.timestamp, older.timestamp])
            expect(result[0].answerCount).toBe(3)
            expect(result[0].scoredQuestions).toHaveLength(3)

            expect(await getTeamsScoredAsks('nope')).toEqual([])
        })

        test('getGlobalScoreTimeline only includes active teams within the last year, grouped per week', async () => {
            expect(await getGlobalScoreTimeline()).toEqual([])

            await seedTeam({ id: 'C1' })
            await seedTeam({ id: 'C2' })
            await seedTeam({ id: 'inactive', active: false })

            // Same week for C1 and C2, use a fixed weekday to avoid crossing week boundaries
            const week = startOfIsoWeekWednesday(subWeeks(new Date(), 2))
            const c1 = await seedAsked({ teamId: 'C1', revealed: true, timestamp: week })
            const c2 = await seedAsked({ teamId: 'C2', revealed: true, timestamp: new Date(week.getTime() + 1000) })
            const otherWeek = await seedAsked({ teamId: 'C1', revealed: true, timestamp: subWeeks(week, 1) })
            const tooOld = await seedAsked({ teamId: 'C1', revealed: true, timestamp: subYears(new Date(), 2) })
            const inactive = await seedAsked({ teamId: 'inactive', revealed: true, timestamp: week })
            const skipped = await seedAsked({ teamId: 'C1', revealed: true, skipped: true, timestamp: week })
            await seedAsked({ teamId: 'C1', revealed: true, timestamp: week })

            await seedAnswers(c1.id, 3, [G, G, G])
            await seedAnswers(c2.id, 4, [G, M, B])
            await seedAnswers(otherWeek.id, 3, [B, B, B])
            for (const ask of [tooOld, inactive, skipped]) {
                await seedAnswers(ask.id, 3, [B, B, B])
            }

            const result = await getGlobalScoreTimeline()
            expect(result).toHaveLength(2)

            const [first, second] = [...result].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
            expect(first).toMatchObject({ timestamp: otherWeek.timestamp, score: 1, answers: 3 })
            expect(second.timestamp).toEqual(c1.timestamp)
            expect(second.answers).toBe(7)
            expect(second.score.toFixed(3)).toEqual(((5 + 17 / 6) / 2).toFixed(3))
            expect(second[QuestionType.TEAM_HEALTH]).toBe(5)
            expect(second[QuestionType.SPEED]).toBe(3.75)
            expect(second[QuestionType.TECH]).toBe(3)
        })
    })

    /**
     * These tests seed "distractor" data (other teams, other asks with answers) so that a join or relation
     * that ignores its foreign key, or a filter that ignores the team, would pick up the wrong rows.
     */
    describe('relations and joins', () => {
        const G = AnswerLevel.GOOD
        const M = AnswerLevel.MEDIUM
        const B = AnswerLevel.BAD

        test('getActiveAsk only includes answers belonging to the active ask', async () => {
            await seedTeam({ id: 'C1' })
            await seedTeam({ id: 'C2' })

            const old = await seedAsked({ teamId: 'C1', revealed: true, timestamp: subWeeks(new Date(), 1) })
            const active = await seedAsked({ teamId: 'C1', revealed: false })
            const otherTeamActive = await seedAsked({ teamId: 'C2', revealed: false })

            await seedAnswer({ askedId: old.id, userId: 'U1', levels: [B, B, B] })
            await seedAnswer({ askedId: old.id, userId: 'U3', levels: [B, B, B] })
            await seedAnswer({ askedId: active.id, userId: 'U1', levels: [G, M, B] })
            await seedAnswer({ askedId: active.id, userId: 'U2', levels: [G, G, G] })
            await seedAnswer({ askedId: otherTeamActive.id, userId: 'U1', levels: [M, M, M] })
            await seedAnswer({ askedId: otherTeamActive.id, userId: 'U2', levels: [M, M, M] })
            await seedAnswer({ askedId: otherTeamActive.id, userId: 'U4', levels: [M, M, M] })

            const c1 = await getActiveAsk('C1')
            expect(c1?.id).toBe(active.id)
            expect(answerSummary(c1?.answers ?? [])).toEqual([
                { askedId: active.id, userId: 'U1', levels: [G, M, B] },
                { askedId: active.id, userId: 'U2', levels: [G, G, G] },
            ])

            const c2 = await getActiveAsk('C2')
            expect(c2?.id).toBe(otherTeamActive.id)
            expect(answerSummary(c2?.answers ?? [])).toEqual([
                { askedId: otherTeamActive.id, userId: 'U1', levels: [M, M, M] },
                { askedId: otherTeamActive.id, userId: 'U2', levels: [M, M, M] },
                { askedId: otherTeamActive.id, userId: 'U4', levels: [M, M, M] },
            ])
        })

        test('getPreviousAsk only includes answers belonging to the previous ask of the same team', async () => {
            await seedTeam({ id: 'C1' })
            await seedTeam({ id: 'C2' })

            const older = await seedAsked({ teamId: 'C1', revealed: true, timestamp: subWeeks(new Date(), 3) })
            const previous = await seedAsked({ teamId: 'C1', revealed: true, timestamp: subWeeks(new Date(), 2) })
            // Newer than "previous", but belongs to another team
            const otherTeam = await seedAsked({ teamId: 'C2', revealed: true, timestamp: subWeeks(new Date(), 1) })
            const current = await seedAsked({ teamId: 'C1', revealed: false, timestamp: new Date() })

            await seedAnswer({ askedId: older.id, userId: 'U5', levels: [B, B, B] })
            await seedAnswer({ askedId: previous.id, userId: 'U1', levels: [G, G, G] })
            await seedAnswer({ askedId: previous.id, userId: 'U2', levels: [G, M, G] })
            await seedAnswer({ askedId: previous.id, userId: 'U3', levels: [M, M, M] })
            await seedAnswer({ askedId: otherTeam.id, userId: 'U9', levels: [B, B, B] })
            await seedAnswer({ askedId: current.id, userId: 'U1', levels: [B, B, B] })

            const result = await getPreviousAsk(current)
            expect(result?.id).toBe(previous.id)
            expect(answerSummary(result?.answers ?? [])).toEqual([
                { askedId: previous.id, userId: 'U1', levels: [G, G, G] },
                { askedId: previous.id, userId: 'U2', levels: [G, M, G] },
                { askedId: previous.id, userId: 'U3', levels: [M, M, M] },
            ])
        })

        test('getTeamByAdGroupAndTeamId only considers asks of the requested team', async () => {
            await seedTeam({ id: 'C1', assosiatedGroup: 'group-a' })
            await seedTeam({ id: 'C2', assosiatedGroup: 'group-a' })
            await seedAsked({ teamId: 'C1', messageTs: 'c1-revealed', revealed: true })
            await seedAsked({ teamId: 'C2', messageTs: 'c2-active', revealed: false })

            expect((await getTeamByAdGroupAndTeamId('group-a', 'C1'))?.activeAskTs).toBeNull()
            expect((await getTeamByAdGroupAndTeamId('group-a', 'C2'))?.activeAskTs).toBe('c2-active')
        })

        test('getTeamByAdGroupAndTeamId matches case-sensitively and treats LIKE wildcards literally', async () => {
            await seedTeam({ id: 'C1', assosiatedGroup: 'abc' })

            expect(await getTeamByAdGroupAndTeamId('b', 'C1')).not.toBeNull()
            expect(await getTeamByAdGroupAndTeamId('abc', 'C1')).not.toBeNull()
            expect(await getTeamByAdGroupAndTeamId('ABC', 'C1')).toBeNull()
            expect(await getTeamByAdGroupAndTeamId('%', 'C1')).toBeNull()
            expect(await getTeamByAdGroupAndTeamId('_', 'C1')).toBeNull()
            expect(await getTeamByAdGroupAndTeamId('a_c', 'C1')).toBeNull()
        })

        test('getTeamScoreTimeline and getTeamScorePerQuestion only use the given team', async () => {
            await seedTeam({ id: 'C1' })
            await seedTeam({ id: 'C2' })
            const timestamp = subWeeks(new Date(), 1)
            const c1 = await seedAsked({ teamId: 'C1', revealed: true, timestamp })
            const c2 = await seedAsked({ teamId: 'C2', revealed: true, timestamp })
            await seedAnswers(c1.id, 3, [G, G, G])
            await seedAnswers(c2.id, 5, [B, B, B])

            expect(await getTeamScoreTimeline('C1')).toEqual([{ timestamp: c1.timestamp, score: 5, answers: 3 }])
            expect(await getTeamScoreTimeline('C2')).toEqual([{ timestamp: c2.timestamp, score: 1, answers: 5 }])

            const perQuestion = await getTeamScorePerQuestion('C1')
            if ('error' in perQuestion) throw new Error(perQuestion.error)
            expect(perQuestion).toHaveLength(3)
            for (const question of perQuestion) {
                expect(question.scoring).toEqual([
                    { timestamp: c1.timestamp, averageScore: 5, distribution: { GOOD: 3, MEDIUM: 0, BAD: 0 } },
                ])
            }
        })

        test('deactivateTeam does not touch other teams active asks', async () => {
            await seedTeam({ id: 'C1' })
            await seedTeam({ id: 'C2' })
            const c1 = await seedAsked({ teamId: 'C1', revealed: false })
            const c2 = await seedAsked({ teamId: 'C2', revealed: false })

            await deactivateTeam('C1')

            expect(await getAskedRow(c1.id)).toMatchObject({ revealed: true, nagged: true, skipped: true })
            expect(await getAskedRow(c2.id)).toMatchObject({ revealed: false, nagged: false, skipped: false })
            expect((await getTeam('C2'))?.active).toBe(true)
        })

        test('funStats.biggestTeam is 0 when asks exist but have no answers', async () => {
            await seedTeam({ id: 'C1' })
            await seedAsked({ teamId: 'C1', revealed: true })

            expect((await funStats()).biggestTeam).toBe(0)
        })

        test('answerQuestions keys answers on (userId, askedId)', async () => {
            await seedTeam({ id: 'C1' })
            const first = await createAsked('ts-1', 'C1', ASK_QUESTIONS)
            const second = await createAsked('ts-2', 'C1', ASK_QUESTIONS)

            await answerQuestions(first, [['question-1', G]], 'U1')
            await answerQuestions(second, [['question-1', B]], 'U1')
            await answerQuestions(first, [['question-1', M]], 'U2')

            expect((await getAnswer('U1', first.id))?.answers).toEqual([
                { questionId: 'question-1', answer: G, type: QuestionType.TEAM_HEALTH },
            ])
            expect((await getAnswer('U1', second.id))?.answers).toEqual([
                { questionId: 'question-1', answer: B, type: QuestionType.TEAM_HEALTH },
            ])
            expect((await getAnswer('U2', first.id))?.answers).toEqual([
                { questionId: 'question-1', answer: M, type: QuestionType.TEAM_HEALTH },
            ])
            expect(await getAnswer('U2', second.id)).toBeNull()
            expect(await drizzle().select().from(schema.answer)).toHaveLength(3)
        })
    })

    /**
     * Runs the actual reveal flow against the database, with only the Slack client mocked.
     */
    describe('reveal flow', () => {
        const G = AnswerLevel.GOOD
        const M = AnswerLevel.MEDIUM
        const B = AnswerLevel.BAD

        beforeEach(() => {
            vi.mocked(createScoreBlocks).mockClear()
        })

        test('reveals with the correct answers, scores and previous scores', async () => {
            const team = await seedTeam({ id: 'C1', questions: ASK_QUESTIONS })
            await seedTeam({ id: 'C2', questions: ASK_QUESTIONS })

            const previous = await seedAsked({ teamId: 'C1', revealed: true, timestamp: subWeeks(new Date(), 1) })
            const active = await seedAsked({ teamId: 'C1', revealed: false, messageTs: 'active-ts' })
            const otherTeam = await seedAsked({ teamId: 'C2', revealed: false })

            await seedAnswers(previous.id, 4, [B, B, B])
            await seedAnswers(active.id, 3, [G, M, B])
            await seedAnswers(otherTeam.id, 5, [G, G, G])

            const client = mockSlackClient()
            expect(await revealTeam(team, client)).toBe(true)

            expect(createScoreBlocks).toHaveBeenCalledTimes(1)
            const [blockTeam, blockAsked, scoredAsk, previousScoredAsk] = vi.mocked(createScoreBlocks).mock.calls[0]

            expect(blockTeam.id).toBe('C1')
            expect(blockAsked.id).toBe(active.id)
            expect(answerSummary(blockAsked.answers)).toEqual(
                ['U1', 'U2', 'U3'].map((userId) => ({ askedId: active.id, userId, levels: [G, M, B] })),
            )

            expect(scoredAsk.answerCount).toBe(3)
            expect(scoredAsk.totalScore.toFixed(2)).toBe('2.83')
            expect(scoredAsk.scoredQuestions.map((it) => [it.id, it.score, it.distribution])).toEqual([
                ['question-1', 5, { GOOD: 3, MEDIUM: 0, BAD: 0 }],
                ['question-2', 2.5, { GOOD: 0, MEDIUM: 3, BAD: 0 }],
                ['question-3', 1, { GOOD: 0, MEDIUM: 0, BAD: 3 }],
            ])

            expect(previousScoredAsk?.timestamp).toEqual(previous.timestamp)
            expect(previousScoredAsk?.answerCount).toBe(4)
            expect(previousScoredAsk?.totalScore).toBe(1)

            expect(client.chat.update).toHaveBeenCalledWith(expect.objectContaining({ channel: 'C1', ts: 'active-ts' }))
            expect(client.chat.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ channel: 'C1', thread_ts: 'active-ts', reply_broadcast: true }),
            )

            expect(await getAskedRow(active.id)).toMatchObject({ revealed: true, skipped: false })
            expect(await getAskedRow(otherTeam.id)).toMatchObject({ revealed: false, skipped: false })
            expect(await getActiveAsk('C1')).toBeNull()
        })

        test('reveals without previous ask', async () => {
            const team = await seedTeam({ id: 'C1', questions: ASK_QUESTIONS })
            const active = await seedAsked({ teamId: 'C1', revealed: false })
            await seedAnswers(active.id, 3, [G, G, G])

            expect(await revealTeam(team, mockSlackClient())).toBe(true)

            const [, , scoredAsk, previousScoredAsk] = vi.mocked(createScoreBlocks).mock.calls[0]
            expect(scoredAsk.totalScore).toBe(5)
            expect(previousScoredAsk).toBeNull()
        })

        test('skips when the active ask has fewer than 3 answers, ignoring answers on other asks', async () => {
            const team = await seedTeam({ id: 'C1', questions: ASK_QUESTIONS })
            await seedTeam({ id: 'C2', questions: ASK_QUESTIONS })

            const previous = await seedAsked({ teamId: 'C1', revealed: true, timestamp: subWeeks(new Date(), 1) })
            const active = await seedAsked({ teamId: 'C1', revealed: false, messageTs: 'active-ts' })
            const otherTeam = await seedAsked({ teamId: 'C2', revealed: false })

            // Plenty of answers elsewhere, a broken join would push the count above 3
            await seedAnswers(previous.id, 5, [G, G, G])
            await seedAnswers(otherTeam.id, 5, [G, G, G])
            await seedAnswers(active.id, 2, [G, G, G])

            const client = mockSlackClient()
            expect(await revealTeam(team, client)).toBe(false)

            expect(createScoreBlocks).not.toHaveBeenCalled()
            expect(client.chat.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    channel: 'C1',
                    thread_ts: 'active-ts',
                    text: expect.stringContaining('kun 2 svar'),
                }),
            )
            expect(await getAskedRow(active.id)).toMatchObject({ revealed: true, skipped: true })
            expect(await getAskedRow(otherTeam.id)).toMatchObject({ revealed: false, skipped: false })
            expect(await getActiveAsk('C1')).toBeNull()
        })

        test('returns false when there is no active ask', async () => {
            const team = await seedTeam({ id: 'C1' })
            await seedAsked({ teamId: 'C1', revealed: true })

            const client = mockSlackClient()
            expect(await revealTeam(team, client)).toBe(false)
            expect(client.chat.postMessage).not.toHaveBeenCalled()
            expect(client.chat.update).not.toHaveBeenCalled()
        })
    })
})

/**
 * Asks are seeded with only the three questions that seedAnswer answers, so scoring is well-defined
 */
const ASK_QUESTIONS = testQuestions.slice(0, 3)

/**
 * Seeding helpers, using drizzle directly
 */
async function seedTeam(
    overrides: Partial<typeof schema.team.$inferInsert> & { id: string },
): Promise<typeof schema.team.$inferSelect> {
    const [team] = await drizzle()
        .insert(schema.team)
        .values({
            name: `Team ${overrides.id}`,
            active: true,
            postDay: Day.FRIDAY,
            postHour: 14,
            revealDay: Day.MONDAY,
            revealHour: 10,
            questions: testQuestions,
            ...overrides,
        })
        .returning()
    return team
}

async function seedAsked(overrides: Partial<typeof schema.asked.$inferInsert> & { teamId: string }): Promise<Asked> {
    const [asked] = await drizzle()
        .insert(schema.asked)
        .values({
            messageTs: `ts-${Math.random()}`,
            timestamp: new Date(),
            questions: ASK_QUESTIONS,
            revealed: false,
            ...overrides,
        })
        .returning()
    return asked as Asked
}

async function seedAnswer({
    askedId,
    userId,
    levels = [AnswerLevel.GOOD, AnswerLevel.GOOD, AnswerLevel.GOOD],
}: {
    askedId: number
    userId: string
    levels?: AnswerLevel[]
}): Promise<void> {
    await drizzle()
        .insert(schema.answer)
        .values({
            askedId,
            userId,
            answeredAt: new Date(),
            answers: levels.map((answer, index): QuestionAnswer => ({
                questionId: testQuestions[index].questionId,
                type: testQuestions[index].type,
                answer,
            })),
        })
}

async function seedAnswers(askedId: number, count: number, levels: AnswerLevel[]): Promise<void> {
    for (let i = 0; i < count; i++) {
        await seedAnswer({ askedId, userId: `U${i + 1}`, levels })
    }
}

function answerSummary(
    answers: { askedId: number; userId: string; answers: unknown }[],
): { askedId: number; userId: string; levels: AnswerLevel[] }[] {
    return answers
        .map((it) => ({
            askedId: it.askedId,
            userId: it.userId,
            levels: (it.answers as QuestionAnswer[]).map((answer) => answer.answer),
        }))
        .sort((a, b) => a.userId.localeCompare(b.userId))
}

type SlackPost = (args: { ts?: string }) => Promise<{ ok: boolean; ts: string | undefined }>
type SlackPostMock = Mock<SlackPost>
type MockSlackClient = App['client'] & { chat: { postMessage: SlackPostMock; update: SlackPostMock } }

function mockSlackClient(): MockSlackClient {
    const postMessage: SlackPostMock = vi.fn<SlackPost>(async () => ({ ok: true, ts: 'posted-ts' }))
    const update: SlackPostMock = vi.fn<SlackPost>(async (args) => ({ ok: true, ts: args.ts }))

    return { chat: { postMessage, update } } as unknown as MockSlackClient
}

async function getAskedRow(id: number): Promise<typeof schema.asked.$inferSelect | undefined> {
    const [row] = await drizzle()
        .select()
        .from(schema.asked)
        .where(sql`${schema.asked.id} = ${id}`)
    return row
}

function ids(teams: { id: string }[]): string[] {
    return teams.map((it) => it.id).sort()
}

function byId<T extends { id: string }>(teams: T[]): T[] {
    return [...teams].sort((a, b) => a.id.localeCompare(b.id))
}

function startOfIsoWeekWednesday(date: Date): Date {
    const d = new Date(date)
    const day = (d.getUTCDay() + 6) % 7
    d.setUTCDate(d.getUTCDate() - day + 2)
    d.setUTCHours(12, 0, 0, 0)
    return d
}
