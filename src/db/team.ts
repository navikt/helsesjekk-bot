import { randomUUID } from 'crypto'

import { questionsFromJsonb, questionsToJsonb } from '../questions/jsonb-utils'
import { defaultQuestions } from '../questions/default'
import { Question, QuestionType } from '../safe-types'

import { Day } from './types'
import { prisma, Team, Asked } from './prisma'
import { getActiveAsk } from './asked'

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
    return prisma().team.findFirst({ where: { id: channelId } })
}

export async function getTeamsByAdGroups(groups: string[]): Promise<Team[] | null> {
    return prisma().team.findMany({ where: { assosiatedGroup: { in: groups } } })
}

export async function getTeamByAdGroupAndTeamId(
    groupId: string,
    teamId: string,
): Promise<(Team & { activeAskTs: string | null }) | null> {
    const team = await prisma().team.findFirst({
        where: { id: teamId, assosiatedGroup: { contains: groupId } },
        include: { Asked: { where: { revealed: false, skipped: false } } },
    })

    if (team == null) return null

    return { ...team, activeAskTs: team.Asked.length > 0 ? team.Asked[0].messageTs : null }
}

export async function getTeamById(teamId: string): Promise<Team | null> {
    return prisma().team.findFirst({ where: { id: teamId } })
}

export async function createTeam(channelId: string, name: string): Promise<Team> {
    return prisma().team.create({
        data: {
            id: channelId,
            name,
            active: true,
            postDay: Day.FRIDAY,
            postHour: 14,
            revealDay: Day.MONDAY,
            revealHour: 10,
            questions: questionsToJsonb(defaultQuestions()),
        },
    })
}

export async function updateTeamGroupAssociation(channelId: string, group: string): Promise<Team> {
    return prisma().team.update({
        data: { assosiatedGroup: group },
        where: { id: channelId },
    })
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
    return prisma().$transaction(async (prisma) => {
        const team = await prisma.team.findFirstOrThrow({ where: { id: channelId } })

        return prisma.team.update({
            data: {
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
            },
            where: { id: channelId },
        })
    })
}

export function deleteQuestionFromTeam(teamId: string, questionId: string): Promise<Team> {
    return prisma().$transaction(async (prisma) => {
        const team = await prisma.team.findFirstOrThrow({ where: { id: teamId } })

        const updatedTeam = prisma.team.update({
            data: {
                questions: questionsToJsonb(
                    questionsFromJsonb(team.questions).filter((q) => q.questionId !== questionId),
                ),
            },
            where: { id: teamId },
        })

        return updatedTeam
    })
}

export function toggleQuestionRequiredInTeam(teamId: string, questionId: string, required: boolean): Promise<Team> {
    return prisma().$transaction(async (prisma) => {
        const team = await prisma.team.findFirstOrThrow({ where: { id: teamId } })

        const updatedTeam = prisma.team.update({
            data: {
                questions: questionsToJsonb(
                    questionsFromJsonb(team.questions).map((q) => {
                        if (q.questionId === questionId) {
                            return { ...q, required }
                        } else {
                            return q
                        }
                    }),
                ),
            },
            where: { id: teamId },
        })

        return updatedTeam
    })
}

export async function setTeamName(teamId: string, name: string): Promise<Team> {
    return prisma().team.update({ data: { name }, where: { id: teamId } })
}

export async function setRevealTime(teamId: string, hour: number, day: number): Promise<Team> {
    return prisma().team.update({ data: { revealHour: hour, revealDay: day }, where: { id: teamId } })
}

export async function setAskTime(teamId: string, hour: number, day: number): Promise<Team> {
    return prisma().team.update({ data: { postHour: hour, postDay: day }, where: { id: teamId } })
}

export async function setTeamStatus(teamId: string, active: boolean): Promise<Team> {
    if (active) {
        return prisma().team.update({ data: { active }, where: { id: teamId } })
    } else {
        return await deactivateTeam(teamId)
    }
}

export async function setTeamFrequency(teamId: string, frequency: number, weekSkew: number): Promise<Team> {
    return prisma().team.update({ data: { frequency, weekSkew }, where: { id: teamId } })
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

    return prisma().team.update({
        data: { questions: questionsToJsonb(updatedQuestions) },
        where: { id: teamId },
    })
}

export async function reactivateTeam(channelId: string): Promise<void> {
    await prisma().team.update({
        data: { active: true },
        where: { id: channelId },
    })
}

export async function deactivateTeam(channelId: string): Promise<Team> {
    const activeAsk = await getActiveAsk(channelId)

    return prisma().$transaction(async (p) => {
        const updatedTeam = await p.team.update({
            data: { active: false },
            where: { id: channelId },
        })

        if (activeAsk != null) {
            await p.asked.update({
                where: { id: activeAsk.id },
                data: { revealed: true, nagged: true, skipped: true },
            })
        }

        return updatedTeam
    })
}

export async function getActiveTeams(): Promise<Team[]> {
    return prisma().team.findMany({ where: { active: true } })
}

export async function getTeamsToReveal(): Promise<Team[]> {
    return prisma().team.findMany({ where: { active: true, Asked: { some: { revealed: false, skipped: false } } } })
}

export async function getBrokenAsks(): Promise<Asked[]> {
    return prisma().asked.findMany({
        where: { revealed: false, skipped: true },
    })
}
