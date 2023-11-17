import React, { ReactElement, Suspense } from 'react'
import * as R from 'remeda'
import { Metadata } from 'next'

import { Alert, Detail, Heading, Skeleton, BodyLong } from 'aksel-server'

import { getMembersOf, MsGraphGroup } from '../../../auth/ms-graph'
import BackLink from '../../../components/core/BackLink'
import SortableGroups from '../../../components/groups/SortableGroups'

export const metadata: Metadata = {
    title: 'Helsesjekk | Dine grupper',
    description: 'Dine grupper i azure ad',
}

async function Page(): Promise<ReactElement> {
    return (
        <div>
            <BackLink href="/kom-i-gang" />
            <Suspense
                fallback={
                    <>
                        <Heading size="large" spacing>
                            Dine grupper
                        </Heading>
                        <div className="flex flex-col gap-3">
                            {R.range(0, 10).map((it) => (
                                <Skeleton key={it} variant="rounded" height={164} />
                            ))}
                        </div>
                    </>
                }
            >
                <UserAdGroups />
            </Suspense>
        </div>
    )
}

async function UserAdGroups(): Promise<ReactElement> {
    const membersOf = await getMembersOf()

    if ('error' in membersOf) {
        return <UserGroupsError error={membersOf} />
    }

    const groups: MsGraphGroup[] = R.sortBy.strict(membersOf.value, [
        (it: MsGraphGroup) => it.displayName?.toLowerCase().includes('team') || false,
        'desc',
    ])

    return (
        <div>
            <Heading size="large" spacing>
                Dine grupper ({membersOf.value.length})
            </Heading>
            <SortableGroups
                groups={R.pipe(
                    membersOf.value,
                    R.sortBy.strict([(it: MsGraphGroup) => it.displayName?.toLowerCase().includes('team'), 'desc']),
                    R.map((it) => ({
                        id: it.id,
                        displayName: it.displayName ?? 'Gruppe uten navn',
                        description: it.description ?? 'Gruppe uten beskrivelse',
                    })),
                )}
            />
        </div>
    )
}

function UserGroupsError({
    error: { statusText, error, status },
}: {
    error: { error: string; status?: number; statusText?: string }
}): ReactElement {
    return (
        <div>
            <Heading size="large" spacing>
                Dine grupper
            </Heading>
            <Alert variant="warning">
                <Heading size="medium" spacing>
                    Kunne ikke laste dine grupper
                </Heading>
                <BodyLong>{error}</BodyLong>
                {status && statusText && (
                    <Detail>
                        {status} {statusText}
                    </Detail>
                )}
            </Alert>
        </div>
    )
}

export default Page
