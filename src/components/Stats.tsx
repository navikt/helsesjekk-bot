import React, { ReactElement, Suspense } from 'react'
import { Skeleton } from '@navikt/ds-react'

import { funStats } from '../db/stats'

import { Detail, Heading, BodyShort } from 'aksel-server'
import { PersonTallShortIcon, QuestionmarkIcon, GavelIcon, HouseHeartIcon } from 'aksel-client'

function Stats(): ReactElement {
    return (
        <section aria-labelledby="stats-header" className="mt-16 max-w-prose">
            <Heading size="large" level="2">
                Botten i NAV
            </Heading>
            <Detail spacing>Noen interessante tall om botten i NAV</Detail>
            <Suspense
                fallback={
                    <div className="grid grid-cols-2 gap-3">
                        <Skeleton variant="rounded" height="84px" />
                        <Skeleton variant="rounded" height="84px" />
                        <Skeleton variant="rounded" height="84px" />
                        <Skeleton variant="rounded" height="84px" />
                    </div>
                }
            >
                <StatsView />
            </Suspense>
        </section>
    )
}

async function StatsView(): Promise<ReactElement> {
    const stats = await funStats()

    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-bg-subtle rounded p-4">
                <div className="flex gap-1 items-center">
                    <PersonTallShortIcon aria-hidden />
                    <Heading size="small">Aktive team</Heading>
                </div>
                <div className="flex gap-2">
                    <BodyShort>{stats.activeTeams}</BodyShort>
                </div>
            </div>
            <div className="bg-bg-subtle rounded p-4">
                <div className="flex gap-1 items-center">
                    <QuestionmarkIcon aria-hidden />
                    <Heading size="small">Antall helsesjekker</Heading>
                </div>
                <div className="flex gap-2">
                    <BodyShort>{stats.totalAsks}</BodyShort>
                </div>
            </div>
            <div className="bg-bg-subtle rounded p-4">
                <div className="flex gap-1 items-center">
                    <GavelIcon aria-hidden />
                    <Heading size="small">Antall svar</Heading>
                </div>
                <div className="flex gap-2">
                    <BodyShort>
                        {stats.totalAnswers} ({(stats.totalAnswers / stats.totalAsks).toFixed(1)} snitt per sjekk)
                    </BodyShort>
                </div>
            </div>
            <div className="bg-bg-subtle rounded p-4">
                <div className="flex gap-1 items-center">
                    <HouseHeartIcon aria-hidden />
                    <Heading size="small">Størst team</Heading>
                </div>
                <div className="flex gap-2">
                    <BodyShort>{stats.biggestTeam} medlemmer</BodyShort>
                </div>
            </div>
        </div>
    )
}

export default Stats
