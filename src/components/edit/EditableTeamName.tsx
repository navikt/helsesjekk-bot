'use client'

import { PencilIcon, PersonTallShortIcon, XMarkIcon } from '@navikt/aksel-icons'
import { Button, TextField, BodyShort, Heading } from '@navikt/ds-react'
import { useParams } from 'next/navigation'
import React, { ReactElement } from 'react'

import { editTeamName } from './actions'

type Props = {
    teamId: string
    name: string
}

export function EditableTeamName({ teamId, name }: Props): ReactElement {
    const params = useParams<{ groupId: string }>()
    const [edit, setEdit] = React.useState(false)

    return (
        <div className="p-3 bg-ax-bg-neutral-soft rounded-sm my-4 relative">
            {!edit && (
                <div>
                    <div className="flex gap-1 items-center">
                        <PersonTallShortIcon aria-hidden />
                        <Heading size="small">Navn</Heading>
                    </div>
                    <div className="flex gap-2">
                        <BodyShort>{name}</BodyShort>
                        <Button
                            data-color="neutral"
                            className="absolute top-2 right-2"
                            icon={<PencilIcon />}
                            title="Rediger team navn"
                            onClick={() => setEdit(true)}
                            size="small"
                            variant="tertiary"
                        />
                    </div>
                </div>
            )}
            {edit && (
                <>
                    <form
                        action={async (data) => {
                            await editTeamName(params.groupId, teamId, data)
                            setEdit(false)
                        }}
                        className="flex gap-2 items-end"
                    >
                        <TextField
                            name="new_name"
                            className="grow"
                            label="Nytt team navn"
                            defaultValue={name}
                            // oxlint-disable-next-line jsx-a11y/no-autofocus
                            autoFocus
                            onKeyUp={(e) => {
                                if (e.keyCode === 27) {
                                    setEdit(false)
                                }
                            }}
                        />
                        <Button data-color="neutral" type="submit" variant="secondary">
                            Lagre
                        </Button>
                    </form>
                    <Button
                        data-color="neutral"
                        className="absolute top-2 right-2"
                        icon={<XMarkIcon />}
                        title="Lukk redigering"
                        onClick={() => setEdit(false)}
                        size="xsmall"
                        variant="tertiary"
                    />
                </>
            )}
        </div>
    )
}
