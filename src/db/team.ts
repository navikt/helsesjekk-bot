import { randomUUID } from 'crypto'
import { and, eq, exists, inArray, like } from 'drizzle-orm'

import { defaultQuestions } from '../questions/default'
import { questionsFromJsonb, questionsToJsonb } from '../questions/jsonb-utils'
import { Question, QuestionType } from '../safe-types'

import { getActiveAsk } from './asked'
import { drizzle } from './drizzle/db'
import { asked, team as teamTable } from './drizzle/schema'
import { Day, type Team, type Asked } from './types'
import { firstOrThrow } from './utils'

export async function teamStatus(channelId: string): Promise<'NEW' | 'DEACTIVATED' | 'ACTIVE'> {
    const team = await getTeam(channelId)

    if (team == null) {
        return 'NEW'
    } else if (!team.active) {
        return 'DEACTIVATED'
    } else {
        return 'ACTIVE'
    }
}

export async function getTeam(channelId: string): Promise<Team | null> {
    const [team] = await drizzle().select().from(teamTable).where(eq(teamTable.id, channelId)).limit(1)

    return team ?? null
}

export async function getTeamsByAdGroups(groups: string[]): Promise<Team[] | null> {
    if (groups.length === 0) return []

    return drizzle().select().from(teamTable).where(inArray(teamTable.assosiatedGroup, groups))
}

export async function getTeamByAdGroupAndTeamId(
    groupId: string,
    teamId: string,
): Promise<(Team & { activeAskTs: string | null }) | null> {
    const team = await drizzle().query.team.findFirst({
        where: {
            id: teamId,
            RAW: (team) => like(team.assosiatedGroup, `%${escapeLike(groupId)}%`),
        },
        with: { Asked: { where: { revealed: false, skipped: false } } },
    })

    if (team == null) return null

    return { ...team, activeAskTs: team.Asked.length > 0 ? team.Asked[0].messageTs : null }
}

export async function getTeamById(teamId: string): Promise<Team | null> {
    return getTeam(teamId)
}

export async function createTeam(channelId: string, name: string): Promise<Team> {
    const rows = await drizzle()
        .insert(teamTable)
        .values({
            id: channelId,
            name,
            active: true,
            postDay: Day.FRIDAY,
            postHour: 14,
            revealDay: Day.MONDAY,
            revealHour: 10,
            questions: questionsToJsonb(defaultQuestions()),
        })
        .returning()

    return firstOrThrow(rows, 'team.create')
}

export async function updateTeamGroupAssociation(channelId: string, group: string): Promise<Team> {
    return updateTeamValues(channelId, { assosiatedGroup: group })
}

export async function updateTeam(
    channelId: string,
    values: {
        name: string
        active: boolean
        postDay: number
        postHour: number
        revealDay: number
        revealHour: number
    },
    newQuestion: null | {
        question: string
        high: string
        mid: string
        low: string
        category: QuestionType
    },
): Promise<Team> {
    return drizzle().transaction(async (tx) => {
        const team = firstOrThrow(
            await tx.select().from(teamTable).where(eq(teamTable.id, channelId)).limit(1),
            'team.findFirstOrThrow',
        )

        const rows = await tx
            .update(teamTable)
            .set({
                name: values.name,
                active: values.active,
                postDay: values.postDay,
                postHour: values.postHour,
                revealDay: values.revealDay,
                revealHour: values.revealHour,
                questions:
                    newQuestion != null
                        ? questionsToJsonb([
                              ...questionsFromJsonb(team.questions),
                              {
                                  questionId: randomUUID(),
                                  question: newQuestion.question,
                                  answers: {
                                      LOW: newQuestion.low,
                                      MID: newQuestion.mid,
                                      HIGH: newQuestion.high,
                                  },
                                  type: newQuestion.category,
                                  custom: true,
                              } satisfies Question,
                          ])
                        : undefined,
            })
            .where(eq(teamTable.id, channelId))
            .returning()

        return firstOrThrow(rows, 'team.update')
    })
}

export function deleteQuestionFromTeam(teamId: string, questionId: string): Promise<Team> {
    return updateTeamQuestions(teamId, (questions) => questions.filter((q) => q.questionId !== questionId))
}

export function toggleQuestionRequiredInTeam(teamId: string, questionId: string, required: boolean): Promise<Team> {
    return updateTeamQuestions(teamId, (questions) =>
        questions.map((q) => (q.questionId === questionId ? { ...q, required } : q)),
    )
}

export async function setTeamName(teamId: string, name: string): Promise<Team> {
    return updateTeamValues(teamId, { name })
}

export async function setRevealTime(teamId: string, hour: number, day: number): Promise<Team> {
    return updateTeamValues(teamId, { revealHour: hour, revealDay: day })
}

export async function setAskTime(teamId: string, hour: number, day: number): Promise<Team> {
    return updateTeamValues(teamId, { postHour: hour, postDay: day })
}

export async function setTeamStatus(teamId: string, active: boolean): Promise<Team> {
    if (active) {
        return updateTeamValues(teamId, { active })
    } else {
        return await deactivateTeam(teamId)
    }
}

export async function setTeamFrequency(teamId: string, frequency: number, weekSkew: number): Promise<Team> {
    return updateTeamValues(teamId, { frequency, weekSkew })
}

export async function addQuestionToTeam(
    teamId: string,
    question: {
        question: string
        type: string
        high: string
        mid: string
        low: string
        required: boolean
    },
): Promise<Team> {
    const team = await getTeamById(teamId)
    if (team == null) throw new Error(`Team with id ${teamId} not found`)

    const existingQuestions = questionsFromJsonb(team.questions)
    const updatedQuestions = [
        ...existingQuestions,
        {
            questionId: randomUUID(),
            question: question.question,
            answers: {
                LOW: question.low,
                MID: question.mid,
                HIGH: question.high,
            },
            type: question.type as QuestionType,
            required: question.required,
            custom: true,
        } satisfies Question,
    ]

    return updateTeamValues(teamId, { questions: questionsToJsonb(updatedQuestions) })
}

export async function reactivateTeam(channelId: string): Promise<void> {
    await updateTeamValues(channelId, { active: true })
}

export async function deactivateTeam(channelId: string): Promise<Team> {
    const activeAsk = await getActiveAsk(channelId)

    return drizzle().transaction(async (tx) => {
        const updatedTeam = firstOrThrow(
            await tx.update(teamTable).set({ active: false }).where(eq(teamTable.id, channelId)).returning(),
            'team.update',
        )

        if (activeAsk != null) {
            firstOrThrow(
                await tx
                    .update(asked)
                    .set({ revealed: true, nagged: true, skipped: true })
                    .where(eq(asked.id, activeAsk.id))
                    .returning(),
                'asked.update',
            )
        }

        return updatedTeam
    })
}

export async function getActiveTeams(): Promise<Team[]> {
    return drizzle().select().from(teamTable).where(eq(teamTable.active, true))
}

export async function getTeamsToReveal(): Promise<Team[]> {
    const db = drizzle()

    return db
        .select()
        .from(teamTable)
        .where(
            and(
                eq(teamTable.active, true),
                exists(
                    db
                        .select()
                        .from(asked)
                        .where(
                            and(eq(asked.teamId, teamTable.id), eq(asked.revealed, false), eq(asked.skipped, false)),
                        ),
                ),
            ),
        )
}

export async function getBrokenAsks(): Promise<Asked[]> {
    return drizzle()
        .select()
        .from(asked)
        .where(and(eq(asked.revealed, false), eq(asked.skipped, true)))
}

async function updateTeamValues(teamId: string, values: Partial<typeof teamTable.$inferInsert>): Promise<Team> {
    const rows = await drizzle().update(teamTable).set(values).where(eq(teamTable.id, teamId)).returning()

    return firstOrThrow(rows, 'team.update')
}

function updateTeamQuestions(teamId: string, update: (questions: Question[]) => Question[]): Promise<Team> {
    return drizzle().transaction(async (tx) => {
        const team = firstOrThrow(
            await tx.select().from(teamTable).where(eq(teamTable.id, teamId)).limit(1),
            'team.findFirstOrThrow',
        )

        const rows = await tx
            .update(teamTable)
            .set({ questions: questionsToJsonb(update(questionsFromJsonb(team.questions))) })
            .where(eq(teamTable.id, teamId))
            .returning()

        return firstOrThrow(rows, 'team.update')
    })
}

/**
 * Prisma's `contains` escapes LIKE wildcards, so we do the same
 */
function escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, (char) => `\\${char}`)
}
