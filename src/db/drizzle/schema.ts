import { pgTable, text, serial, timestamp, integer, boolean, jsonb, foreignKey, primaryKey } from 'drizzle-orm/pg-core'

export const answer = pgTable(
    'Answer',
    {
        answeredAt: timestamp({ precision: 3 }).notNull(),
        askedId: integer().notNull(),
        answers: jsonb().notNull(),
        userId: text().notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.userId, table.askedId], name: 'Answer_pkey' }),
        foreignKey({
            columns: [table.askedId],
            foreignColumns: [asked.id],
            name: 'Answer_askedId_fkey',
        })
            .onUpdate('cascade')
            .onDelete('restrict'),
    ],
)

export const asked = pgTable(
    'Asked',
    {
        id: serial().primaryKey(),
        messageTs: text().notNull(),
        teamId: text().notNull(),
        timestamp: timestamp({ precision: 3 }).notNull(),
        questions: jsonb().notNull(),
        revealed: boolean().notNull(),
        nagged: boolean().default(false).notNull(),
        skipped: boolean().default(false).notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.teamId],
            foreignColumns: [team.id],
            name: 'Asked_teamId_fkey',
        })
            .onUpdate('cascade')
            .onDelete('restrict'),
    ],
)

export const team = pgTable('Team', {
    id: text().primaryKey(),
    name: text().notNull(),
    active: boolean().notNull(),
    postDay: integer().notNull(),
    postHour: integer().notNull(),
    revealDay: integer().notNull(),
    revealHour: integer().notNull(),
    questions: jsonb().notNull(),
    assosiatedGroup: text(),
    frequency: integer().default(1).notNull(),
    weekSkew: integer().default(0).notNull(),
})
