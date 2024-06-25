import * as R from 'remeda'
import React, { ReactElement } from 'react'
import { BodyShort, Heading } from '@navikt/ds-react'
// @ts-expect-error TODO, link panel is deprecated
import { LinkPanel, LinkPanelDescription, LinkPanelTitle } from '@navikt/ds-react/LinkPanel'
import { Metadata } from 'next'
import Link from 'next/link'

import { Question, QuestionType } from '../../../../safe-types'
import { getTeamByAdGroupAndTeamId } from '../../../../db'
import { userHasAdGroup } from '../../../../auth/authentication'
import { questionTypeToText } from '../../../../utils/asked'
import { questionsFromJsonb } from '../../../../questions/jsonb-utils'
import { TeamNotAccesible, TeamNotFound } from '../../../../components/errors/ErrorMessages'
import BackLink from '../../../../components/core/BackLink'
import EditableTeamName from '../../../../components/edit/EditableTeamName'
import EditableTime from '../../../../components/edit/EditableTime'
import EditableStatus from '../../../../components/edit/EditableStatus'
import AddQuestion from '../../../../components/edit/AddQuestion'
import DeletableQuestion from '../../../../components/edit/DeletableQuestion'
import EditableFrequency from '../../../../components/edit/EditableFrequency'
import { PingDot } from '../../../../components/core/Dots'
import { createPermalink } from '../../../../utils/slack'
import { dayIndexToDay } from '../../../../utils/date'

export const metadata: Metadata = {
    title: 'Helsesjekk | Team',
    description: 'Detaljer for ditt team i helsesjekk bot',
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
        <div className="max-w-prose">
            <BackLink href="/" />
            <Heading size="large">{team.name}</Heading>
            <LinkPanel
                as={Link}
                href={`/team/${params.groupId}/${params.teamId}/graph`}
                border
                className="my-2"
                prefetch={false}
            >
                <LinkPanelTitle>Se helsegraf</LinkPanelTitle>
                <LinkPanelDescription>Graf over utviklingen av teamhelse over tid</LinkPanelDescription>
            </LinkPanel>
            <LinkPanel
                as={Link}
                href={`/team/${params.groupId}/${params.teamId}/results`}
                border
                className="my-2"
                prefetch={false}
            >
                <LinkPanelTitle>Se tidligere resultater</LinkPanelTitle>
                <LinkPanelDescription>Alle gyldige tidligere resultater</LinkPanelDescription>
            </LinkPanel>
            <EditableTeamName teamId={team.id} name={team.name} />
            {team.activeAskTs != null && (
                <ActiveAsk
                    teamId={team.id}
                    askTs={team.activeAskTs}
                    revealDay={team.revealDay}
                    revealHour={team.revealHour}
                />
            )}
            <EditableStatus teamId={team.id} active={team.active} />
            <EditableFrequency
                teamId={team.id}
                postDay={team.postDay}
                postHour={team.postHour}
                frequency={team.frequency}
                weekSkew={team.weekSkew}
                hasActiveAsk={team.activeAskTs != null}
            />
            <EditableTime teamId={team.id} hour={team.postHour} day={team.postDay} type="ask" />
            <EditableTime teamId={team.id} hour={team.revealHour} day={team.revealDay} type="reveal" />
            <Questions teamId={team.id} questions={questionsFromJsonb(team.questions)} />
        </div>
    )
}

function ActiveAsk({
    teamId,
    askTs,
    revealDay,
    revealHour,
}: {
    teamId: string
    askTs: string
    revealDay: number
    revealHour: number
}): ReactElement {
    return (
        <div className="p-3 bg-bg-subtle rounded my-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex gap-2 items-center">
                        <div className="ml-1">
                            <PingDot />
                        </div>
                        <Heading size="small">Aktiv spørring akkurat nå</Heading>
                    </div>
                    <BodyShort spacing>
                        Spørringen blir lukket og vist på {dayIndexToDay(revealDay)} kl. {revealHour}
                    </BodyShort>
                    <a href={createPermalink(teamId, askTs)} target="_blank" rel="noreferrer">
                        Gå til spørring (Slack)
                    </a>
                </div>
            </div>
        </div>
    )
}

function Questions({ teamId, questions }: { teamId: string; questions: Question[] }): ReactElement {
    const groups = R.groupBy(questions, R.prop('type'))

    return (
        <div>
            <Heading size="medium" level="2" spacing>
                Spørsmål ({questions.length})
            </Heading>
            <div className="flex flex-col gap-4">
                {R.entries(groups).map(([type, questions]) => (
                    <div key={type}>
                        <Heading size="small" level="3" spacing>
                            {questionTypeToText(type as QuestionType)}
                        </Heading>
                        <ul className="flex flex-col gap-3">
                            {questions.map((question) => (
                                <li key={question.questionId} className="bg-bg-subtle p-3 pt-2 rounded relative">
                                    <DeletableQuestion teamId={teamId} question={question} />
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
                <AddQuestion teamId={teamId} />
            </div>
        </div>
    )
}

export default Page
