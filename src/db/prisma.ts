import { PrismaClient, Asked, Team, Answer } from '@prisma/client'

import logger from '../logger'
import { defaultQuestions } from '../questions/default'
import { answerToJsonb, questionsFromJsonb, questionsToJsonb } from '../questions/jsonb-utils'

import { AnswerLevel, Day, Question, QuestionAnswer } from './types'

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
            questions: questionsToJsonb(defaultQuestions()),
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

export async function hasActiveAsk(teamId: string): Promise<boolean> {
    const asked = getActiveAsk(teamId)

    logger.info(`Checking if team ${teamId} has active ask: ${asked != null}`)

    return asked != null
}

export async function getActiveAsk(teamId: string): Promise<Asked | null> {
    return prisma.asked.findFirst({ where: { teamId, revealed: false } })
}

function mapToAnswers(answers: [questionId: string, value: string][], questions: Question[]): QuestionAnswer[] {
    return answers.map(([questionId, value]) => {
        const question = questions.find((question) => question.questionId === questionId)

        if (question == null) {
            throw new Error(`Unable to find question with id ${questionId}`)
        }

        return {
            answer: value as AnswerLevel,
            questionId: question.questionId,
            type: question.type,
        }
    })
}

export async function answerQuestions(
    asked: Asked,
    answers: [questionId: string, value: string][],
    userId: string,
): Promise<void> {
    const mappedAnswers = answerToJsonb(mapToAnswers(answers, questionsFromJsonb(asked.questions)))
    await prisma.answer.upsert({
        create: {
            userId,
            askedId: asked.id,
            answeredAt: new Date(),
            answers: mappedAnswers,
        },
        update: {
            answers: mappedAnswers,
        },
        where: {
            questionAnsweredIdentifier: {
                userId,
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
            questions: questionsToJsonb(questions),
            revealed: false,
        },
    })

    return
}

export async function getAsked(channelId: string, ts: string): Promise<Asked | null> {
    return prisma.asked.findFirst({
        where: { messageTs: ts, teamId: channelId },
    })
}

export async function getAnswer(userId: string, askedId: number): Promise<Answer | null> {
    return prisma.answer.findFirst({
        where: { userId: userId, askedId: askedId },
    })
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
