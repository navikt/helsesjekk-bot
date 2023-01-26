import { questionsToJsonb } from '../questions/jsonb-utils'
import { defaultQuestions } from '../questions/default'

import { Day } from './types'
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
