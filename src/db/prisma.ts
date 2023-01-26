import { AnswerLevel, PrismaClient, Asked, Team } from '@prisma/client'

import logger from '../logger'
import { defaultQuestions } from '../questions/default'
import { fromJsonb, toJsonb } from '../questions/jsonb-utils'

import { Day, Question } from './types'

export const prisma = new PrismaClient()

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
            questions: toJsonb(defaultQuestions()),
        },
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
): Promise<Team> {
    return prisma.team.update({
        data: {
            name: values.name,
            active: values.active,
            postDay: values.postDay,
            postHour: values.postHour,
            revealDay: values.revealDay,
            revealHour: values.revealHour,
        },
        where: { id: channelId },
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

export async function answerQuestion(
    asked: Asked,
    userId: string,
    channelId: string,
    questionId: string,
    value: string,
): Promise<void> {
    await prisma.answer.upsert({
        create: {
            userId,
            askedId: asked.id,
            // TODO get from asked
            questionType: 'TEAM_HEALTH',
            questionId,
            answer: value as AnswerLevel,
            answeredAt: new Date(),
        },
        update: {
            answer: value as AnswerLevel,
        },
        where: {
            questionAnsweredIdentifier: {
                userId,
                questionId,
                askedId: asked.id,
            },
        },
    })
}

export async function createAsked(ts: string, teamId: string, questions: Question[]): Promise<void> {
    await prisma.asked.create({
        data: {
            teamId: teamId,
            messageTs: ts,
            timestamp: new Date(),
            questions: toJsonb(questions),
        },
    })

    return
}

export async function getAsked(channelId: string, ts: string): Promise<Asked | null> {
    return prisma.asked.findFirst({
        where: { messageTs: ts, teamId: channelId },
    })
}

export async function hasUserAnsweredAllQuestionsForAsked(asked: Asked, userId: string): Promise<boolean> {
    const answers = await prisma.answer.findMany({
        where: { askedId: asked.id, userId: userId },
    })

    return answers.length === fromJsonb(asked.questions).length
}

export async function isReady(): Promise<boolean> {
    try {
        await prisma.$connect()
        return true
    } catch (e) {
        logger.error(new Error('Unable to connect to database', { cause: e }))
        return false
    }
}

export * from '@prisma/client'
