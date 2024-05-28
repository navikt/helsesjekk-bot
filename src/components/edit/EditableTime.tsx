'use client'

import * as R from 'remeda'
import React, { ReactElement } from 'react'
import { useParams } from 'next/navigation'
import { Button, Select, Heading, BodyShort } from '@navikt/ds-react'
import { PencilIcon, QuestionmarkIcon, GavelIcon, XMarkIcon } from '@navikt/aksel-icons'

import { dayIndexToDay } from '../../utils/date'

import { editTime } from './actions'

type Props = {
    teamId: string
    type: 'reveal' | 'ask'
    hour: number
    day: number
}

function EditableTime({ teamId, type, hour, day }: Props): ReactElement {
    const params = useParams<{ groupId: string }>()
    const [edit, setEdit] = React.useState(false)

    return (
        <div className="p-3 bg-bg-subtle rounded my-4 relative">
            {!edit && (
                <div>
                    <div className="flex gap-1 items-center">
                        <Icon type={type} />
                        <Heading size="small">{type === 'ask' ? 'Spør' : 'Viser'}</Heading>
                    </div>
                    <div className="flex gap-2">
                        <BodyShort>
                            {dayIndexToDay(day)} kl. {hour}:00
                        </BodyShort>
                        <Button
                            className="absolute top-2 right-2"
                            icon={<PencilIcon />}
                            title="Rediger tidspunkt"
                            onClick={() => setEdit(true)}
                            size="small"
                            variant="tertiary-neutral"
                        />
                    </div>
                </div>
            )}
            {edit && (
                <>
                    <form
                        action={async (data) => {
                            await editTime(params.groupId, teamId, type, data)
                            setEdit(false)
                        }}
                        className="flex gap-2 items-end"
                    >
                        <Select label="Dag" name="day" className="grow" defaultValue={day} autoFocus>
                            {R.range(0, 7).map((it) => (
                                <option key={it} value={it}>
                                    {dayIndexToDay(it)}
                                </option>
                            ))}
                        </Select>
                        <Select label="Klokkeslett" name="hour" className="grow" defaultValue={hour}>
                            {R.range(0, 23).map((it) => (
                                <option key={it} value={it}>
                                    {it}:00
                                </option>
                            ))}
                        </Select>
                        <Button type="submit" variant="secondary-neutral">
                            Lagre
                        </Button>
                    </form>
                    <Button
                        className="absolute top-2 right-2"
                        icon={<XMarkIcon />}
                        title="Lukk redigering"
                        onClick={() => setEdit(false)}
                        size="xsmall"
                        variant="tertiary-neutral"
                    />
                </>
            )}
        </div>
    )
}

function Icon({ type }: { type: Props['type'] }): ReactElement {
    if (type === 'ask') {
        return <QuestionmarkIcon aria-hidden />
    } else {
        return <GavelIcon aria-hidden />
    }
}

export default EditableTime
