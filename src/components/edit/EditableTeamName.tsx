'use client'

import React, { ReactElement } from 'react'
import { useParams } from 'next/navigation'

import { editTeamName } from './actions'

import { Heading } from 'aksel-server'
import { Button, TextField, PencilIcon, PersonTallShortIcon, XMarkIcon } from 'aksel-client'

type Props = {
    teamId: string
    name: string
}

function EditableTeamName({ teamId, name }: Props): ReactElement {
    const params = useParams<{ groupId: string }>()
    const [edit, setEdit] = React.useState(false)

    return (
        <div className="p-3 bg-bg-subtle rounded my-4 relative">
            {!edit && (
                <div>
                    <div className="flex gap-1 items-center">
                        <PersonTallShortIcon aria-hidden />
                        <Heading size="small">Navn</Heading>
                    </div>
                    <div className="flex gap-2">
                        <Heading size="medium" level="2">
                            {name}
                        </Heading>
                        <Button
                            className="absolute top-2 right-2"
                            icon={<PencilIcon />}
                            title="Rediger team navn"
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
                            autoFocus
                            onKeyUp={(e) => {
                                if (e.keyCode === 27) {
                                    setEdit(false)
                                }
                            }}
                        />
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

export default EditableTeamName
