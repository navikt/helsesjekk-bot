export function raise(message: Error): never
export function raise(message: string): never
export function raise(error: Error | string): never {
    if (typeof error === 'string') {
        throw new Error(error)
    }

    throw error
}
