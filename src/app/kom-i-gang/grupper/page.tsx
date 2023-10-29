import React, { ReactElement, Suspense } from 'react'
import * as R from 'remeda'
import { Metadata } from 'next'

import { getUser, verifyUserLoggedIn } from '../../../auth/authentication'
import { getMembersOf, MsGraphGroup } from '../../../auth/ms-graph'
import BackLink from '../../../components/core/BackLink'

import { Alert, Detail, Heading, Skeleton, BodyLong } from 'aksel-server'
import { CopyButton } from 'aksel-client'

export const metadata: Metadata = {
    title: 'Helsesjekk | Dine grupper',
    description: 'Dine grupper i azure ad',
}

async function Page(): Promise<ReactElement> {
    await verifyUserLoggedIn('/kom-i-gang/grupper')

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
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const user = getUser()
    const membersOf = await getMembersOf()

    if ('error' in membersOf) {
        return <UserGroupsError error={membersOf} />
    }

    const relevantGroups = membersOf.value.filter((it) => user.adGroups.includes(it.id))

    return (
        <div>
            <Heading size="large" spacing>
                Dine grupper ({relevantGroups.length})
            </Heading>
            <div className="flex flex-col gap-3">
                {relevantGroups.map((group) => (
                    <GroupListItem key={group.id} group={group} />
                ))}
            </div>
        </div>
    )
}

function GroupListItem({ group }: { group: MsGraphGroup }): ReactElement {
    return (
        <div className="bg-bg-subtle rounded p-4">
            <Heading size="small">{group.displayName}</Heading>
            <BodyLong className="mb-2">{group.description}</BodyLong>
            <Detail>Koble denne gruppen til teamet ditt</Detail>
            <div className="bg-white flex justify-between items-center p-2">
                <pre className="overflow-hidden">/helsesjekk assign {group.id}</pre>
                <CopyButton size="small" copyText={`/helsesjekk assign ${group.id}`} />
            </div>
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
