'use client'

import React, { ReactElement, useState } from 'react'
import { CopyButton, Button, TextField, BodyLong, Detail, Heading } from '@navikt/ds-react'
import { XMarkIcon } from '@navikt/aksel-icons'

type Props = {
    groups: {
        id: string
        displayName: string | null
        description: string | null
    }[]
}

function SortableGroups({ groups }: Props): ReactElement {
    const [search, setSearch] = useState('')

    return (
        <div>
            <div className="max-w-prose flex gap-3 mb-2">
                <TextField
                    size="small"
                    hideLabel
                    placeholder="Søk i gruppenavn"
                    label="Søk i gruppenavn"
                    className="grow"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
                <Button
                    size="small"
                    variant="secondary-neutral"
                    onClick={() => setSearch('')}
                    icon={<XMarkIcon title="Resett søkefelt" />}
                />
            </div>
            <div className="flex flex-col gap-3">
                {groups
                    .filter((group) => group.displayName?.toLowerCase().includes(search.toLowerCase()) ?? true)
                    .map((group) => (
                        <GroupListItem key={group.id} group={group} />
                    ))}
            </div>
        </div>
    )
}

function GroupListItem({ group }: { group: Props['groups'][number] }): ReactElement {
    return (
        <div className="bg-bg-subtle rounded p-4">
            <Heading size="small">{group.displayName ?? 'Gruppe uten navn'}</Heading>
            <BodyLong className="mb-2">{group.description}</BodyLong>
            <Detail>Koble denne gruppen til teamet ditt</Detail>
            <div className="bg-white flex justify-between items-center p-2">
                <pre className="overflow-hidden">/helsesjekk assign {group.id}</pre>
                <CopyButton size="small" copyText={`/helsesjekk assign ${group.id}`} />
            </div>
        </div>
    )
}

export default SortableGroups
