import { Asked, Team, prisma } from './prisma'

export async function adminGetTeamsWithAsked(): Promise<
    (Team & {
        Asked: (Pick<Asked, 'id' | 'messageTs' | 'nagged' | 'skipped' | 'revealed' | 'questions'> & {
            _count: { answers: number }
        })[]
    })[]
> {
    const allTeams = await prisma().team.findMany({
        include: {
            Asked: {
                select: {
                    id: true,
                    messageTs: true,
                    nagged: true,
                    skipped: true,
                    revealed: true,
                    questions: true,
                    _count: { select: { answers: true } },
                },
            },
        },
    })

    return allTeams
}
