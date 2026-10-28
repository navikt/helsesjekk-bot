'use client'

import { Checkbox } from '@navikt/ds-react'
import { Switch } from '@navikt/ds-react'
import React, { ReactElement, useState } from 'react'

import { adminToggleTeamStatus } from './_admin-actions'

type Props = {
    id: string
    active: boolean
}

function AdminTeamToggler({ id, active }: Props): ReactElement {
    const [unlocked, setUnlocked] = useState(false)

    return (
        <div className="flex gap-4">
            <Switch
                position="right"
                hideLabel
                checked={active}
                disabled={!unlocked}
                onChange={(event) => adminToggleTeamStatus(id, event.target.checked)}
            >
                Endre status
            </Switch>
            <Checkbox
                value="Bakerst"
                onChange={(event) => {
                    setUnlocked(event.target.checked)
                }}
            >
                Lås opp
            </Checkbox>
        </div>
    )
}

export default AdminTeamToggler
