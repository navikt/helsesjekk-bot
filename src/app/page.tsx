import { ReactElement } from 'react'
import { headers } from 'next/headers'

export default function Page(): ReactElement {
    const authHeader = headers().get('authorization')

    return (
        <div>
            <h1>Page</h1>
            <p>Authorization header: {authHeader ?? 'Missing'}</p>
        </div>
    )
}
