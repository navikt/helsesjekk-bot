import { createLoader, parseAsBoolean } from 'nuqs/server'

export const showOldSearchParams = {
    'show-old': parseAsBoolean.withDefault(false).withOptions({
        clearOnDefault: true,
        shallow: false,
    }),
}

export const loadSearchParams = createLoader(showOldSearchParams)
