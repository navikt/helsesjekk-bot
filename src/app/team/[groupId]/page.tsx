import React, { ReactElement } from 'react'
import { BodyLong, BodyShort, Heading } from '@navikt/ds-react'

import { getTeamByAdGroup } from '../../../db'
import { userHasAdGroup } from '../../../auth/authentication'
import { dayIndexToDay } from '../../../utils/date'

type Props = {
    params: {
        groupId: string
    }
}

async function Page({ params }: Props): Promise<ReactElement> {
    if (!userHasAdGroup(params.groupId)) {
        return (
            <div>
                <Heading size="large" spacing>
                    Du har ikke tilgang til dette teamet
                </Heading>
                <BodyShort spacing>Teamet kan også ikke finnes.</BodyShort>
                <BodyLong>
                    Du kan koble teamet ditt sin kanal til et team ved å bruke{' '}
                    <code className="bg-gray-100 p-1">/helsesjekk assign gruppe-id</code> i kanalen hvor botten er
                    aktivert.
                </BodyLong>
            </div>
        )
    }
    const team = await getTeamByAdGroup(params.groupId)

    if (!team) {
        return (
            <div>
                <Heading size="large" spacing>
                    Teamet finnes ikke
                </Heading>
                <BodyShort spacing>Teamet kan også ikke finnes.</BodyShort>
                <BodyLong spacing>
                    Du kan koble teamet ditt sin kanal til et team ved å bruke{' '}
                    <code className="bg-gray-100 p-1">/helsesjekk assign gruppe-id</code> i kanalen hvor botten er
                    aktivert.
                </BodyLong>
                <BodyLong>Dersom du har koblet til et team, så kan det være at du har brukt feil gruppe-id.</BodyLong>
            </div>
        )
    }

    return (
        <div>
            <Heading size="large" spacing>
                {team.name}
            </Heading>
            <BodyShort spacing>
                Spør på {dayIndexToDay(team.postDay)} kl. {team.postHour}:00
            </BodyShort>
            <BodyShort spacing>
                Viser svar på {dayIndexToDay(team.revealDay)} kl. {team.revealHour}:00
            </BodyShort>
        </div>
    )
}

export default Page
