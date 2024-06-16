'use client'

import React, { ReactElement, useState } from 'react'
import { useParams } from 'next/navigation'
import { getYear } from 'date-fns'
import { Button, Select, Tooltip, Heading, BodyShort, Detail } from '@navikt/ds-react'
import { PencilIcon, PersonTallShortIcon, XMarkIcon, PadlockLockedIcon } from '@navikt/aksel-icons'

import {
    Frequency,
    getRelevantWeeks,
    getWeekNumbersInYear,
    nextOccurenceText,
    nextOccurrence,
} from '../../utils/frequency'
import { dayIndexToDay, getNowInNorway, getWeekNumber } from '../../utils/date'
import { cn } from '../../utils/tw-utils'

import { editFrequency } from './actions'

type Props = {
    teamId: string
    postDay: number
    postHour: number
    frequency: number
    weekSkew: number
    hasActiveAsk: boolean
}

function EditableStatus({ teamId, frequency, weekSkew, postDay, postHour, hasActiveAsk }: Props): ReactElement {
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
            {hasActiveAsk ? (
                <Tooltip content="Frekvens kan ikke redigeres når det er en aktiv spørring">
                    <PadlockLockedIcon className="absolute top-3 right-3 text-2xl" />
                </Tooltip>
            ) : edit ? (
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
                    title="Rediger frekvens"
                    onClick={() => setEdit(true)}
                    size="small"
                    variant="tertiary-neutral"
                />
            )}
        </div>
    )
}

function FrequencyStatus({
    frequency,
    weekSkew,
    postDay,
    postHour,
}: Omit<Props, 'teamId' | 'hasActiveAsk'>): ReactElement {
    const { postDate } = nextOccurrence({
        team: {
            postDay,
            postHour,
        },
        frequency,
        weekSkew,
    })

    return (
        <div>
            <div className="flex gap-1 items-center">
                <PersonTallShortIcon aria-hidden />
                <Heading size="small">Frekvens</Heading>
            </div>
            <BodyShort>{frequency === 1 ? 'Hver uke' : `Hver ${frequency}. uke`}</BodyShort>
            <WeeksToPostGrid frequency={frequency} offset={weekSkew} />
            <Detail>
                Neste spørring er {`${dayIndexToDay(postDay)} kl. ${postHour}:00`} {nextOccurenceText(postDate)}
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
}: Omit<Props, 'hasActiveAsk'> & { onComplete: () => void }): ReactElement {
    const params = useParams<{ groupId: string }>()
    const [newFrequency, setNewFrequency] = useState<number>(frequency)
    const [newOffset, setNewOffset] = useState<number>(weekSkew)

    const { postDate } = nextOccurrence({
        team: {
            postDay,
            postHour,
        },
        frequency: newFrequency,
        weekSkew: newOffset,
    })

    return (
        <form
            action={async () => {
                await editFrequency(params.groupId, teamId, newFrequency, newOffset)
                onComplete()
            }}
        >
            <div className="flex gap-2 items-end">
                <Select
                    label="Frekvens"
                    name="frequency"
                    className="grow"
                    autoFocus
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
            <WeeksToPostGrid frequency={newFrequency} offset={newOffset} />
            <Detail className="mt-1">
                Neste spørring blir {`${dayIndexToDay(postDay)} kl. ${postHour}:00`} {nextOccurenceText(postDate)}
            </Detail>
        </form>
    )
}

function WeeksToPostGrid({ frequency, offset }: { frequency: number; offset: number }): ReactElement | null {
    if (frequency === Frequency.WEEKLY) return null

    const now = getNowInNorway()
    const currentWeek = getWeekNumber(now)
    const [allWeeks, nextYear] = getWeekNumbersInYear(now)
    const relevantWeeks = getRelevantWeeks(now, frequency, offset)
    return (
        <div className="mb-2">
            <Detail className="mb-1">Uker som spørres på i {getYear(now)}</Detail>
            <div className="grid grid-cols-26 gap-1">
                {allWeeks.map((week) => (
                    <div
                        key={week}
                        className={cn('border rounded flex items-center justify-center text-xs transition-colors', {
                            'bg-green-200': relevantWeeks.includes(week),
                            'border-2 border-dotted': week === currentWeek,
                        })}
                    >
                        {week}
                    </div>
                ))}
            </div>
            <Detail className="mt-2">Uker som spørres på i {getYear(now) + 1}</Detail>
            <div className="grid grid-cols-26 gap-1">
                {nextYear.map((week) => (
                    <div
                        key={week}
                        className={cn('border rounded flex items-center justify-center text-xs transition-colors', {
                            'bg-green-200': relevantWeeks.includes(week),
                        })}
                    >
                        {week}
                    </div>
                ))}
                <div className="border rounded flex items-center justify-center text-xs">...</div>
            </div>
        </div>
    )
}

export default EditableStatus
