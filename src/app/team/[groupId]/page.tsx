import * as R from 'remeda'
import React, { ReactElement } from 'react'
import { Heading } from '@navikt/ds-react'
import { Metadata } from 'next'
import Link from 'next/link'

import { getTeamByAdGroup } from '../../../db'
import { userHasAdGroup, verifyUserLoggedIn } from '../../../auth/authentication'
import { questionTypeToText } from '../../../utils/asked'
import { questionsFromJsonb } from '../../../questions/jsonb-utils'
import BackLink from '../../../components/core/BackLink'
import EditableTeamName from '../../../components/edit/EditableTeamName'
import EditableTime from '../../../components/edit/EditableTime'
import EditableStatus from '../../../components/edit/EditableStatus'
import { TeamNotAccesible, TeamNotFound } from '../../../components/errors/ErrorMessages'
import AddQuestion from '../../../components/edit/AddQuestion'
import { Question, QuestionType } from '../../../safe-types'
import DeletableQuestion from '../../../components/edit/DeletableQuestion'

import { LinkPanelDescription, LinkPanelTitle, LinkPanel } from 'aksel-client'

export const metadata: Metadata = {
    title: 'Helsesjekk | Team',
    description: 'Detaljer for ditt team i helsesjekk bot',
}

type Props = {
    params: {
        groupId: string
    }
}

async function Page({ params }: Props): Promise<ReactElement> {
    await verifyUserLoggedIn(`/team/${params.groupId}`)

    if (!(await userHasAdGroup(params.groupId))) {
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
        <div className="max-w-prose">
            <BackLink href="/" />
            <Heading size="large">Ditt team</Heading>
            <LinkPanel as={Link} href={`/team/${params.groupId}/graph`} border className="my-2" prefetch={false}>
                <LinkPanelTitle>Se helsegraf</LinkPanelTitle>
                <LinkPanelDescription>Se utviklingen av teamhelse over tid</LinkPanelDescription>
            </LinkPanel>
            <EditableStatus teamId={team.id} active={team.active} />
            <EditableTeamName teamId={team.id} name={team.name} />
            <EditableTime teamId={team.id} hour={team.postHour} day={team.postDay} type="ask" />
            <EditableTime teamId={team.id} hour={team.revealHour} day={team.revealDay} type="reveal" />
            <Questions teamId={team.id} questions={questionsFromJsonb(team.questions)} />
        </div>
    )
}

function Questions({ teamId, questions }: { teamId: string; questions: Question[] }): ReactElement {
    const groups = R.groupBy.strict(questions, R.prop('type'))

    return (
        <div>
            <Heading size="medium" level="2" spacing>
                Spørsmål ({questions.length})
            </Heading>
            <div className="flex flex-col gap-4">
                {R.toPairs.strict(groups).map(([type, questions]) => (
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
