import React, { ReactElement } from 'react'
import Link from 'next/link'

import { Team } from '../db'
import { dayIndexToDay } from '../utils/date'

import { InactiveDot, PingDot } from './core/Dots'

import { BodyShort, Detail, Heading, LinkPanel } from 'aksel-server'
import { GavelIcon, QuestionmarkIcon, Tooltip } from 'aksel-client'

type Props = {
    team: Team
}

function TeamCard({ team }: Props): ReactElement {
    return (
        <LinkPanel as={Link} href={`/team/${team.assosiatedGroup}/${team.id}`} className="max-w-sm grow relative">
            <Tooltip content={`Teamet er ${team.active ? 'aktivt' : 'deaktivert'}`}>
                <div className="flex gap-3 items-center">
                    {team.active ? <PingDot /> : <InactiveDot />}
                    <Heading size="small">{team.name}</Heading>
                </div>
            </Tooltip>
            <div className="flex gap-4 flex-wrap">
                <div>
                    <Detail className="flex gap-1 items-center">
                        <QuestionmarkIcon aria-hidden />
                        Spør på
                    </Detail>
                    <BodyShort>
                        {dayIndexToDay(team.postDay)} kl. {team.postHour}:00
                    </BodyShort>
                </div>
                <div>
                    <Detail className="flex gap-1 items-center">
                        <GavelIcon aria-hidden />
                        Viser svar
                    </Detail>
                    <BodyShort>
                        {dayIndexToDay(team.revealDay)} kl. {team.revealHour}:00
                    </BodyShort>
                </div>
            </div>
        </LinkPanel>
    )
}

export default TeamCard
