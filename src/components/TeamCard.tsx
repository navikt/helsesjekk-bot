import React, { ReactElement } from 'react'
import Link from 'next/link'

import { Team } from '../db'
import { dayIndexToDay } from '../utils/date'

import { Heading, BodyShort, Detail, LinkPanel } from 'aksel-server'

type Props = {
    team: Team
}

function TeamCard({ team }: Props): ReactElement {
    return (
        <LinkPanel as={Link} href={`/team/${team.assosiatedGroup}`} className="max-w-sm">
            <Heading size="small">{team.name}</Heading>
            <div>
                <Detail>Spør på</Detail>
                <BodyShort>
                    {dayIndexToDay(team.postDay)} kl. {team.postHour}:00
                </BodyShort>
            </div>
            <div>
                <Detail>Viser svar</Detail>
                <BodyShort>
                    {dayIndexToDay(team.revealDay)} kl. {team.revealHour}:00
                </BodyShort>
            </div>
        </LinkPanel>
    )
}

export default TeamCard
