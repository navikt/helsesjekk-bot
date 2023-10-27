import React, { ReactElement } from 'react'

import { getUser } from '../auth/authentication'

import { Skeleton, BodyShort, Detail } from 'aksel-server'

async function LoggedInUser(): Promise<ReactElement> {
    const user = getUser()

    return (
        <div className="flex gap-4 p-4">
            <div className="text-right">
                <BodyShort>{user.name}</BodyShort>
                <Detail className="whitespace-nowrap">{user.email}</Detail>
            </div>
            <div className="w-[48px] h-[48px] bg-gray-400 rounded-full flex items-center justify-center text-2xl">
                {user.name[0]}
            </div>
        </div>
    )
}

export function LoggedInUserSkeleton(): ReactElement {
    return (
        <div className="flex gap-4 p-4">
            <div>
                <Skeleton width={120} />
                <Skeleton width={60} />
            </div>
            <Skeleton width={48} height={48} variant="circle" />
        </div>
    )
}

export default LoggedInUser
