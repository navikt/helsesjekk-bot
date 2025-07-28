import { defineConfig } from 'eslint/config'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
})

const eslintConfig = defineConfig([
    ...compat.config({
        extends: ['@navikt/teamsykmelding', 'next'],
    }),
    {
        files: ['e2e/**'],
        rules: { 'testing-library/prefer-screen-queries': 'off' },
    },
])

export default eslintConfig
