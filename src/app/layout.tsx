import './global.css'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { ReactElement } from 'react'

import { validateWonderwallToken } from '../auth/authentication'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'

export default async function RootLayout({ children }: LayoutProps<'/'>): Promise<ReactElement> {
    await validateWonderwallToken('/')

    return (
        <html lang="en">
            <body className="flex flex-col min-h-screen">
                <Header />
                <main className="container p-4 ax-sm:p-16 ax-sm:pt-4 min-h-fit grow">
                    <NuqsAdapter>{children}</NuqsAdapter>
                </main>
                <Footer />
            </body>
        </html>
    )
}
