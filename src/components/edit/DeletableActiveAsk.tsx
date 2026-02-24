'use client'

import React, { ReactElement, useState, useTransition } from 'react'
import { BodyShort, Button, Heading, Switch } from '@navikt/ds-react'
import { useParams } from 'next/navigation'

import { PingDot } from '../core/Dots'
import { dayIndexToDay } from '../../utils/date'
import { createPermalink } from '../../utils/slack'

import { deleteActiveAsk } from './actions'

type Props = {
    teamId: string
    askTs: string
    revealDay: number
    revealHour: number
}

export function DeleteableActiveAsk({ teamId, askTs, revealDay, revealHour }: Props): ReactElement {
    const params = useParams<{ groupId: string }>()
    const [isDeleting, startTransition] = useTransition()
    const [lemmeDelete, setLemmeDelete] = useState(false)

    return (
        <div className="p-3 bg-bg-subtle rounded-sm my-4">
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
            <div className="mt-4 flex gap-3 border-2 border-dotted justify-between items-center rounded-md p-2 border-border-subtle">
                <Switch
                    checked={lemmeDelete}
                    onChange={() => setLemmeDelete((prev) => !prev)}
                    disabled={isDeleting}
                    size="small"
                >
                    Jeg vil slette
                </Switch>
                <Button
                    variant="danger"
                    size="small"
                    disabled={!lemmeDelete}
                    loading={isDeleting}
                    onClick={() =>
                        startTransition(async () => {
                            await deleteActiveAsk(params.groupId, teamId)
                        })
                    }
                >
                    Slett spørringen (NB! Dette kan ikke angres)
                </Button>
            </div>
        </div>
    )
}
