'use client'

import React, { ReactElement, useState } from 'react'
import { useParams } from 'next/navigation'

import { Heading, BodyShort, Detail } from 'aksel-server'
import { Button, PencilIcon, PersonTallShortIcon, Select, XMarkIcon } from 'aksel-client'

import { nextAsk } from '../../utils/frequency'
import { dayIndexToDay, daysUntil } from '../../utils/date'

import { editFrequency } from './actions'

type Props = {
    teamId: string
    postDay: number
    postHour: number
    frequency: number
    weekSkew: number
}

function EditableStatus({ teamId, frequency, weekSkew, postDay, postHour }: Props): ReactElement {
    const [edit, setEdit] = useState(false)

    return (
        <div className="p-3 bg-bg-subtle rounded my-4 relative">
            {!edit ? (
                <FrequencyStatus frequency={frequency} weekSkew={weekSkew} postDay={postDay} postHour={postHour} />
            ) : (
                <EditableFrequencyForm
                    frequency={frequency}
                    weekSkew={weekSkew}
                    postDay={postDay}
                    postHour={postHour}
                    teamId={teamId}
                    onComplete={() => setEdit(false)}
                />
            )}
            {edit ? (
                <Button
                    className="absolute top-2 right-2"
                    icon={<XMarkIcon />}
                    title="Lukk redigering"
                    onClick={() => setEdit(false)}
                    size="xsmall"
                    variant="tertiary-neutral"
                />
            ) : (
                <Button
                    className="absolute top-2 right-2"
                    icon={<PencilIcon />}
                    title="Rediger team navn"
                    onClick={() => setEdit(true)}
                    size="small"
                    variant="tertiary-neutral"
                />
            )}
        </div>
    )
}

function FrequencyStatus({ frequency, weekSkew, postDay, postHour }: Omit<Props, 'teamId'>): ReactElement {
    const [nextDate] = nextAsk({
        frequency,
        weekSkew: weekSkew,
        postDay,
    })
    const days = daysUntil(nextDate)

    return (
        <div>
            <div className="flex gap-1 items-center">
                <PersonTallShortIcon aria-hidden />
                <Heading size="small">Frekvens</Heading>
            </div>
            <BodyShort>{frequency === 1 ? 'Hver uke' : `Hver ${frequency}. uke`}</BodyShort>
            <Detail>
                Neste spørring er {`${dayIndexToDay(postDay)} kl. ${postHour}:00`}{' '}
                {days === 0 ? 'i dag' : `om ${days + 1} dager`}
            </Detail>
        </div>
    )
}

function EditableFrequencyForm({
    frequency,
    weekSkew,
    postDay,
    postHour,
    teamId,
    onComplete,
}: Props & { onComplete: () => void }): ReactElement {
    const params = useParams<{ groupId: string }>()
    const [newFrequency, setNewFrequency] = useState<number>(frequency)
    const [newOffset, setNewOffset] = useState<number>(weekSkew)

    const [nextDateNew] = nextAsk({
        frequency: newFrequency,
        weekSkew: newOffset,
        postDay,
    })
    const daysNew = daysUntil(nextDateNew)

    return (
        <form
            action={async (data) => {
                await editFrequency(params.groupId, teamId, data)
                onComplete()
            }}
        >
            <div className="flex gap-2 items-end">
                <Select
                    label="Frekvens"
                    name="frequency"
                    className="grow"
                    value={newFrequency}
                    onChange={(e) => {
                        setNewFrequency(+e.target.value)
                        setNewOffset(0)
                    }}
                >
                    <option value="1">Ukentlig</option>
                    <option value="2">Annenhver uke</option>
                    <option value="3">Tredjehver uke</option>
                    <option value="4">Hver 4. uke</option>
                </Select>
                {newFrequency > 1 && (
                    <Select
                        label="Ukesjustering"
                        name="weekSkew"
                        value={newOffset}
                        onChange={(e) => setNewOffset(+e.target.value)}
                    >
                        <option value="0">Ingen</option>
                        <option value="1">+1</option>
                        {newFrequency > 2 && <option value="2">+2</option>}
                        {newFrequency > 3 && <option value="3">+3</option>}
                    </Select>
                )}
                <Button type="submit" variant="secondary-neutral">
                    Lagre
                </Button>
            </div>
            <Detail className="mt-1">
                Neste spørring blir {`${dayIndexToDay(postDay)} kl. ${postHour}:00`}{' '}
                {daysNew === 0 ? 'i dag' : `om ${daysNew + 1} dager`}
            </Detail>
        </form>
    )
}

export default EditableStatus
