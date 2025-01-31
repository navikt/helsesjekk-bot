'use client'

import React, { ReactElement, startTransition } from 'react'
import { Switch } from '@navikt/ds-react'
import { useQueryState } from 'nuqs'

import { showOldSearchParams } from './only-current-search-params'

function OnlyCurrentQuestionsToggle(): ReactElement {
    const [showOld, setShowOld] = useQueryState('show-old', showOldSearchParams['show-old'])

    return (
        <Switch
            position="right"
            checked={showOld}
            onChange={(event) =>
                startTransition(async () => {
                    await setShowOld(event.target.checked)
                })
            }
        >
            Vis gamle spørsmål
        </Switch>
    )
}

export default OnlyCurrentQuestionsToggle
