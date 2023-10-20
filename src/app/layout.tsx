import { PropsWithChildren, ReactElement } from 'react'

export default function RootLayout({ children }: PropsWithChildren): ReactElement {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}
