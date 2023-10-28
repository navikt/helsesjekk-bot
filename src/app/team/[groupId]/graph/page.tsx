import * as R from 'remeda'
import React, { ReactElement, Suspense } from 'react'

import { TeamNotAccesible, TeamNotFound } from '../../../../components/errors/ErrorMessages'
import { userHasAdGroup } from '../../../../auth/authentication'
import BackLink from '../../../../components/core/BackLink'
import { getTeamByAdGroup } from '../../../../db'
import { getTeamScoreTimeline } from '../../../../db/score'
import OverallScoreGraph from '../../../../components/graphs/OverallScoreGraph'
import { getWeekNumber } from '../../../../utils/date'

import { Heading, Skeleton, BodyLong, Detail } from 'aksel-server'

type Props = {
    params: {
        groupId: string
    }
}

async function Page({ params }: Props): Promise<ReactElement> {
    if (!userHasAdGroup(params.groupId)) {
        return (
            <div>
                <BackLink href="/" />
                <TeamNotAccesible />
            </div>
        )
    }

    const team = await getTeamByAdGroup(params.groupId)
    if (!team) {
        return (
            <div>
                <BackLink href="/" />
                <TeamNotFound />
            </div>
        )
    }

    return (
        <div>
            <BackLink href={`/team/${params.groupId}`} />
            <Heading size="large">Helsegraf for {team.name}</Heading>
            <Suspense fallback={<Skeleton height={300} variant="rounded" />}>
                <OverallGraph teamId={team.id} />
            </Suspense>
        </div>
    )
}

async function OverallGraph({ teamId }: { teamId: string }): Promise<ReactElement> {
    const scoreTimeline = await getTeamScoreTimeline(teamId)

    if (scoreTimeline.length === 0) {
        return (
            <div className="max-w-prose">
                <Heading size="medium" level="3" spacing>
                    Teamet ditt har ingen data
                </Heading>
                <BodyLong>
                    Det er ingen data å vise for teamet ditt. Dette kan skyldes at teamet ditt ikke har svart på noen
                    spørsmål enda.
                </BodyLong>
            </div>
        )
    }

    const earliest = R.minBy(scoreTimeline, (it) => it.timestamp.getTime())
    return (
        <div>
            <Heading size="medium" level="3">
                Score per uke
            </Heading>
            <Detail>
                {scoreTimeline.length} målinger siden Uke {getWeekNumber(earliest.timestamp)},{' '}
                {earliest.timestamp.getFullYear()}
            </Detail>
            <div className="mt-4">
                <OverallScoreGraph data={scoreTimeline} />
            </div>
        </div>
    )
}

export default Page
