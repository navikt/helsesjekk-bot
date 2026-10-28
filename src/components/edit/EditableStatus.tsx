'use client'

import { Heading, BodyShort } from '@navikt/ds-react'
import { Switch } from '@navikt/ds-react'
import { useParams } from 'next/navigation'
import React, { ReactElement, startTransition } from 'react'

import { InactiveDot, PingDot } from '../core/Dots'

import { toggleTeamStatus } from './actions'

type Props = {
    teamId: string
    active: boolean
}

export function EditableStatus({ teamId, active }: Props): ReactElement {
    const params = useParams<{ groupId: string }>()
    const [loading, setLoading] = React.useState(false)

    return (
        <div className="p-3 bg-ax-bg-neutral-soft rounded-sm my-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex gap-2 items-center">
                        <div className="ml-1">{active ? <PingDot /> : <InactiveDot />}</div>
                        <Heading size="small">Status</Heading>
                    </div>
                    <div className="flex gap-2">
                        <BodyShort>{active ? 'Aktiv' : 'Inaktiv'}</BodyShort>
                    </div>
                </div>
                <Switch
                    position="right"
                    hideLabel
                    checked={active}
                    loading={loading}
                    onChange={(event) => {
                        setLoading(true)
                        startTransition(() => {
                            void toggleTeamStatus(params.groupId, teamId, event.target.checked).finally(() => {
                                setLoading(false)
                            })
                        })
                    }}
                >
                    Endre status
                </Switch>
            </div>
        </div>
    )
}
