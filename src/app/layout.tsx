import 'next-logger'
import './global.css'

import { PropsWithChildren, ReactElement } from 'react'

import Header from '../components/Header'

export default function RootLayout({ children }: PropsWithChildren): ReactElement {
    return (
        <html lang="en">
            <body>
                <Header />
                <main className="container mx-auto">{children}</main>
            </body>
        </html>
    )
}
