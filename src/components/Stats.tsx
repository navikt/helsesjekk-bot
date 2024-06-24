import React, { ReactElement, Suspense } from 'react'
import { unstable_noStore as noStore } from 'next/cache'
import { Skeleton } from '@navikt/ds-react'
import { Detail, Heading, BodyShort } from '@navikt/ds-react'
import {
    PersonTallShortIcon,
    QuestionmarkIcon,
    GavelIcon,
    HouseHeartIcon,
    HandShakeHeartIcon,
    TenancyIcon,
} from '@navikt/aksel-icons'

import { funStats } from '../db/stats'

function Stats(): ReactElement {
    return (
        <section aria-labelledby="stats-header" className="mt-16 max-w-prose">
            <Heading size="large" level="2">
                Botten i NAV
            </Heading>
            <Detail spacing>Noen interessante tall om botten i NAV</Detail>
            <Suspense fallback={<StatsSkeleton />}>
                <StatsView />
            </Suspense>
        </section>
    )
}

async function StatsView(): Promise<ReactElement> {
    noStore()

    const stats = await funStats()

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div className="bg-bg-subtle rounded p-4">
                <div className="flex gap-1 items-center">
                    <TenancyIcon aria-hidden />
                    <Heading size="small">Flest spørsmål i team</Heading>
                </div>
                <div className="flex gap-2">
                    <BodyShort>{stats.mostQuestions} spørsmål</BodyShort>
                </div>
            </div>
            <div className="bg-bg-subtle rounded p-4">
                <div className="flex gap-1 items-center">
                    <HandShakeHeartIcon aria-hidden />
                    <Heading size="small">Helsesjekk Dashboard</Heading>
                </div>
                <div className="flex gap-2">
                    <BodyShort>{stats.dashboardTeams} team</BodyShort>
                </div>
            </div>
        </div>
    )
}

function StatsSkeleton(): ReactElement {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Skeleton variant="rounded" height="84px" />
            <Skeleton variant="rounded" height="84px" />
            <Skeleton variant="rounded" height="84px" />
            <Skeleton variant="rounded" height="84px" />
            <Skeleton variant="rounded" height="84px" />
            <Skeleton variant="rounded" height="84px" />
        </div>
    )
}

export default Stats
