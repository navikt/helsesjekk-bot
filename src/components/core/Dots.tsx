import React, { ReactElement } from 'react'

export function PingDot(): ReactElement {
    return (
        <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
    )
}

export function InactiveDot(): ReactElement {
    return (
        <span className="relative flex h-3 w-3">
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-300"></span>
        </span>
    )
}
