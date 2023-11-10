import * as R from 'remeda'
import React, { ReactElement, Suspense } from 'react'
import { getYear } from 'date-fns'
import { Metadata } from 'next'

import { Heading, Skeleton, BodyLong, Detail } from 'aksel-server'

import { TeamNotAccesible, TeamNotFound } from '../../../../../components/errors/ErrorMessages'
import { userHasAdGroup } from '../../../../../auth/authentication'
import BackLink from '../../../../../components/core/BackLink'
import { getTeamByAdGroupAndTeamId } from '../../../../../db'
import { getTeamsScoredAsks } from '../../../../../db/score'
import { getWeekNumber } from '../../../../../utils/date'
import { ScoredAsk } from '../../../../../metrics/metrics'
import { questionTypeToText } from '../../../../../utils/asked'
import { QuestionType } from '../../../../../safe-types'
import { scoreToEmoji } from '../../../../../utils/score'
import { createPermalink } from '../../../../../utils/slack'

export const metadata: Metadata = {
    title: 'Helsesjekk | Team | Resultater',
    description: 'Alle resultater for ditt team',
}

type Props = {
    params: {
        groupId: string
        teamId: string
    }
}

async function Page({ params }: Props): Promise<ReactElement> {
    const team = await getTeamByAdGroupAndTeamId(params.groupId, params.teamId)
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
            <BackLink href={`/team/${params.groupId}/${params.teamId}`} />
            <Heading size="large">Alle resultater for {team.name}</Heading>
            <Heading size="medium" level="3">
                Tidligere spørringer
            </Heading>
            <Suspense
                fallback={
                    <div>
                        <Skeleton width={210} height={20} />
                        <div className="mt-4 flex flex-wrap gap-4">
                            {R.range(0, 8).map((it) => (
                                <Skeleton key={it} height={358} width={236} variant="rounded" />
                            ))}
                        </div>
                    </div>
                }
            >
                <PreviousAskedView teamId={team.id} />
            </Suspense>
        </div>
    )
}

async function PreviousAskedView({ teamId }: { teamId: string }): Promise<ReactElement> {
    const scoredAsks = await getTeamsScoredAsks(teamId)

    if (scoredAsks.length === 0) {
        return (
            <div className="mb-4">
                <div className="">
                    <Heading size="medium" level="4" spacing>
                        Teamet ditt har ingen data
                    </Heading>
                    <BodyLong>
                        Det er ingen tidligere spørringer å vise for teamet ditt. Dette kan skyldes at teamet ditt ikke
                        har svart på noen spørsmål enda, eller at ingen av spørringene hadde 3 eller flere svar.
                    </BodyLong>
                </div>
            </div>
        )
    }

    const earliest = R.minBy(scoredAsks, (it) => it.timestamp.getTime())
    return (
        <div>
            <Detail>
                {scoredAsks.length} målinger siden uke {getWeekNumber(earliest.timestamp)},{' '}
                {earliest.timestamp.getFullYear()}
            </Detail>
            <div className="mt-4 flex flex-wrap gap-4">
                {scoredAsks.map((it) => (
                    <ScoredAskView key={it.timestamp.toISOString()} channelId={teamId} ask={it} />
                ))}
            </div>
        </div>
    )
}

function ScoredAskView({ channelId, ask }: { channelId: string; ask: ScoredAsk }): ReactElement {
    const groups = R.groupBy.strict(ask.scoredQuestions, R.prop('type'))

    return (
        <div className="bg-bg-subtle rounded p-4 grow max-w-sm">
            <Heading size="medium" level="4">
                Uke {getWeekNumber(ask.timestamp)} {getYear(ask.timestamp)}
            </Heading>
            <Heading level="4" size="xsmall">
                Ukesscore
            </Heading>
            <div className="flex gap-2">
                <span className="mt-0.5">{scoreToEmoji(ask.totalScore)}</span>
                <span>{ask.totalScore.toFixed(2)}</span>
            </div>
            {R.toPairs.strict(groups).map(([type, questions]) => (
                <div key={type}>
                    <Heading level="4" size="small">
                        {questionTypeToText(type as QuestionType)}
                    </Heading>
                    {questions.map((question) => (
                        <div key={question.id} className="flex gap-2">
                            <span className="mt-0.5">{scoreToEmoji(question.score)}</span>
                            <span>{question.question}</span>
                            <span>{question.score.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            ))}
            <div className="mt-2">
                <a
                    href={createPermalink(channelId, ask.messageTs)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-800 hover:underline"
                >
                    Gå til spørring (Slack)
                </a>
            </div>
        </div>
    )
}

export default Page
