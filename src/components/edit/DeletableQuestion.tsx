'use client'

import { ReactElement, useState, useTransition } from 'react'
import { BodyLong, Switch } from '@navikt/ds-react'
import { useParams } from 'next/navigation'

import { Alert, Heading } from 'aksel-server'
import { SparklesIcon, Tooltip, TrashIcon, Button, XMarkIcon, ConfirmationPanel } from 'aksel-client'

import { Question } from '../../safe-types'

import { deleteQuestion, toggleQuestionRequired } from './actions'

type Props = {
    teamId: string
    question: Question
}

function DeletableQuestion({ teamId, question }: Props): ReactElement {
    const params = useParams<{ groupId: string }>()
    const [isDeleting, setIsDeleting] = useState(false)
    const [hasChecked, setHasChecked] = useState(false)
    const [isToggling, startTransition] = useTransition()

    return (
        <>
            <div className="flex items-center justify-between">
                <Heading size="small" level="4" spacing className="mt-0 flex gap-2 items-center">
                    {question.custom && (
                        <Tooltip content="Dette er et spørsmål dere har lagt til selv">
                            <SparklesIcon className="mt-1" title="Dette er et egetlagd spørsmål" />
                        </Tooltip>
                    )}
                    {question.question}
                </Heading>
                {!isDeleting && (
                    <div className="flex gap-3 -mt-2">
                        <Switch
                            size="small"
                            position="right"
                            disabled={isToggling}
                            onChange={(event) =>
                                startTransition(() =>
                                    toggleQuestionRequired(
                                        params.groupId,
                                        teamId,
                                        question.questionId,
                                        event.target.checked,
                                    ),
                                )
                            }
                            checked={question.required ?? true}
                        >
                            Påkrevd
                        </Switch>
                        <Button
                            className=""
                            icon={<TrashIcon title="Slett spørsmål" />}
                            size="small"
                            variant="tertiary-neutral"
                            onClick={() => setIsDeleting(true)}
                        />
                    </div>
                )}
            </div>
            {isDeleting && (
                <div className="flex flex-col gap-2">
                    <Alert variant="warning">
                        <Heading size="small" level="4" spacing>
                            Er du sikker på at du vil slette dette spørsmålet?
                        </Heading>
                        <BodyLong>
                            Når du sletter dette spørsmålet, vil det ikke lenger være mulig å svare på det. Du kan ikke
                            angre denne handlingen. Spørsmålet vil fortsatt dukke opp på helsegrafene.
                        </BodyLong>
                    </Alert>
                    <ConfirmationPanel
                        checked={hasChecked}
                        label="Ja, jeg vil slette dette spørsmålet"
                        onChange={() => setHasChecked((x) => !x)}
                        autoFocus
                    />
                    {hasChecked && (
                        <div>
                            <Button
                                className="mt-2"
                                icon={<TrashIcon />}
                                iconPosition="right"
                                variant="danger"
                                onClick={() => {
                                    startTransition(() => {
                                        deleteQuestion(params.groupId, teamId, question.questionId)
                                    })
                                }}
                            >
                                Slett
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {!isDeleting && (
                <ul className="flex flex-col gap-3">
                    <QuestionListItem emoji="🟢" text={question.answers.HIGH} />
                    <QuestionListItem emoji="🟡" text={question.answers.MID} />
                    <QuestionListItem emoji="🔴" text={question.answers.LOW} />
                </ul>
            )}
            {isDeleting && (
                <Button
                    className="absolute top-1 right-1"
                    icon={<XMarkIcon />}
                    title="Lukk sletting"
                    onClick={() => setIsDeleting(false)}
                    size="small"
                    variant="tertiary-neutral"
                />
            )}
        </>
    )
}

function QuestionListItem({ text, emoji }: { text: string; emoji: string }): ReactElement {
    return (
        <li className="flex items-center">
            <span className="pr-2">{emoji}</span>
            <span className="mb-0.5">{text}</span>
        </li>
    )
}

export default DeletableQuestion
