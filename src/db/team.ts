import { randomUUID } from 'crypto'

import { questionsFromJsonb, questionsToJsonb } from '../questions/jsonb-utils'
import { defaultQuestions } from '../questions/default'

import { Day, Question, QuestionType } from './types'
import { prisma, Team } from './prisma'

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
    return prisma.team.findFirst({ where: { id: channelId } })
}

export async function getTeamsByAdGroups(groups: string[]): Promise<Team[] | null> {
    return prisma.team.findMany({ where: { assosiatedGroup: { in: groups } } })
}

export async function getTeamByAdGroup(groupId: string): Promise<Team | null> {
    return prisma.team.findFirst({ where: { assosiatedGroup: { contains: groupId } } })
}

export async function createTeam(channelId: string, name: string): Promise<Team> {
    return prisma.team.create({
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
    return prisma.team.update({
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
    return prisma.$transaction(async (prisma) => {
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

export function deleteQuestion(teamId: string, questionId: string): Promise<Team> {
    return prisma.$transaction(async (prisma) => {
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

export async function reactivateTeam(channelId: string): Promise<void> {
    await prisma.team.update({
        data: { active: true },
        where: { id: channelId },
    })
}

export async function deactivateTeam(channelId: string): Promise<void> {
    await prisma.team.update({
        data: { active: false },
        where: { id: channelId },
    })
}

export async function getActiveTeams(): Promise<Team[]> {
    return prisma.team.findMany({ where: { active: true } })
}
