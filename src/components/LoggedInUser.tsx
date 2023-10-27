import React, { ReactElement } from 'react'
import { Skeleton, BodyShort, Detail } from 'aksel-server'

async function LoggedInUser(): Promise<ReactElement> {
    const loggedInUser: { name: string; email: string } = await new Promise((resolve) =>
        setTimeout(() => resolve({ name: 'Test user', email: 'user@nav.no' }), 1000),
    )

    return (
        <div className="flex gap-4 p-4">
            <div>
                <BodyShort>{loggedInUser.name}</BodyShort>
                <Detail>{loggedInUser.email}</Detail>
            </div>
            <div className="w-[48px] h-[48px] bg-gray-400 rounded-full flex items-center justify-center text-2xl">
                {loggedInUser.name[0]}
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
