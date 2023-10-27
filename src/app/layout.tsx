import 'next-logger'
import './global.css'

import { PropsWithChildren, ReactElement } from 'react'

export default function RootLayout({ children }: PropsWithChildren): ReactElement {
    return (
        <html lang="en">
            <body>
                <header>
                    <h1 className="p-16">Header</h1>
                </header>
                <main>{children}</main>
            </body>
        </html>
    )
}
