import React, { PropsWithChildren, ReactElement } from 'react'

function Code({ children }: PropsWithChildren): ReactElement {
    return <code className="text-sm bg-gray-100 rounded-sm p-1">{children}</code>
}

export default Code
