import { ReactElement } from 'react'
import { headers } from 'next/headers'

import { verifyUserLoggedIn } from '../auth/authentication'

export default async function Page(): Promise<ReactElement> {
    await verifyUserLoggedIn('/')

    const authHeader = headers().get('authorization')

    return (
        <div>
            <h1>Page</h1>
            <p>Authorization header: {authHeader ?? 'Missing'}</p>
        </div>
    )
}
