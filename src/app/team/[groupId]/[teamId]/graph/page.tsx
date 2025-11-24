import * as R from 'remeda'
import React, { ReactElement, Suspense } from 'react'
import { Metadata } from 'next'
import { BodyLong, Detail, Heading, Skeleton } from '@navikt/ds-react'

import { TeamNotAccesible, TeamNotFound } from '../../../../../components/errors/ErrorMessages'
import { userHasAdGroup } from '../../../../../auth/authentication'
import BackLink from '../../../../../components/core/BackLink'
import { getTeamByAdGroupAndTeamId } from '../../../../../db'
import { getTeamScorePerQuestion, getTeamScoreTimeline } from '../../../../../db/score'
import OverallScoreGraph from '../../../../../components/graphs/OverallScoreGraph'
import { getWeekNumber } from '../../../../../utils/date'
import ScorePerQuestion from '../../../../../components/graphs/ScorePerQuestion'
import { raise } from '../../../../../utils/ts-utils'
import OnlyCurrentQuestionsToggle from '../../../../../components/graphs/OnlyCurrentQuestionsToggle'
import { loadSearchParams } from '../../../../../components/graphs/only-current-search-params'

export const metadata: Metadata = {
    title: 'Helsesjekk | Team | Graf',
    description: 'Graf over helsesjekkene i ditt team',
}

async function Page({ params, searchParams }: PageProps<'/team/[groupId]/[teamId]/graph'>): Promise<ReactElement> {
    const pageParams = await params
    const queryParams = await loadSearchParams(searchParams)

    const team = await getTeamByAdGroupAndTeamId(pageParams.groupId, pageParams.teamId)
    if (!team) {
        return (
            <div>
                <BackLink href="/" />
                <TeamNotFound />
            </div>
        )
    }

    if (!(await userHasAdGroup(team.assosiatedGroup))) {
        return (
            <div>
                <BackLink href="/" />
                <TeamNotAccesible />
            </div>
        )
    }

    return (
        <div>
            <BackLink href={`/team/${pageParams.groupId}/${pageParams.teamId}`} />
            <Heading size="large">Helsegraf for {team.name}</Heading>
            <Suspense fallback={<Skeleton height={300} variant="rounded" />}>
                <OverallGraph teamId={team.id} />
            </Suspense>
            <Suspense fallback={<Skeleton height={300} variant="rounded" />}>
                <PerQuestionGraph teamId={team.id} showOld={queryParams['show-old'] ?? false} />
            </Suspense>
        </div>
    )
}

async function OverallGraph({ teamId }: { teamId: string }): Promise<ReactElement> {
    const scoreTimeline = await getTeamScoreTimeline(teamId)

    if ('error' in scoreTimeline || scoreTimeline.length === 0) {
        return (
            <div className="mb-4">
                <Heading size="medium" level="3">
                    Total score per uke
                </Heading>
                <div className="w-full aspect-video relative flex items-center justify-center flex-col border rounded-sm border-border-subtle">
                    <Heading size="medium" level="4" spacing>
                        Teamet ditt har ingen data
                    </Heading>
                    <BodyLong>
                        Det er ingen data å vise for teamet ditt. Dette kan skyldes at teamet ditt ikke har svart på
                        noen spørsmål enda.
                    </BodyLong>
                </div>
            </div>
        )
    }

    const earliest =
        R.firstBy(scoreTimeline, (it) => it.timestamp.getTime()) ??
        raise(new Error('Illegal state: Always min 1 element in this list'))

    return (
        <div>
            <Heading size="medium" level="3">
                Total score per uke
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

async function PerQuestionGraph({ teamId, showOld }: { teamId: string; showOld: boolean }): Promise<ReactElement> {
    const teamMetrics = await getTeamScorePerQuestion(teamId)

    if ('error' in teamMetrics) {
        return (
            <div className="mb-4">
                <Heading size="medium" level="3">
                    Score per spørsmål per uke
                </Heading>
                <div className="w-full aspect-video relative flex items-center justify-center flex-col border rounded-sm border-border-subtle">
                    <Heading size="medium" level="3" spacing>
                        Teamet ditt har ingen data
                    </Heading>
                    <BodyLong>
                        Det er ingen data å vise for teamet ditt. Dette kan skyldes at teamet ditt ikke har svart på
                        noen spørsmål enda.
                    </BodyLong>
                </div>
            </div>
        )
    }

    const earliest = { timestamp: new Date() }

    return (
        <div>
            <div className="flex justify-between">
                <div>
                    <Heading size="medium" level="3">
                        Score per spørsmål per uke
                    </Heading>
                    <Detail>
                        {teamMetrics.length} målinger siden Uke {getWeekNumber(earliest.timestamp)},{' '}
                        {earliest.timestamp.getFullYear()}
                    </Detail>
                </div>
                <OnlyCurrentQuestionsToggle />
            </div>
            <div className="mt-4">
                {teamMetrics
                    .filter((it) => (showOld ? true : it.question.isCurrent))
                    .map((it) => (
                        <ScorePerQuestion key={it.question.questionId} question={it.question} scoring={it.scoring} />
                    ))}
            </div>
        </div>
    )
}

export default Page
