import { defineRelations } from 'drizzle-orm'

import * as schema from './schema'

export const relations = defineRelations(schema, (r) => ({
    answer: {
        asked: r.one.asked({
            from: r.answer.askedId,
            to: r.asked.id,
        }),
    },
    asked: {
        answers: r.many.answer(),
        team: r.one.team({
            from: r.asked.teamId,
            to: r.team.id,
        }),
    },
    team: {
        Asked: r.many.asked(),
    },
}))
