import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import { defineConfig } from 'eslint/config'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import tsmEslintReact from '@navikt/tsm-eslint-react'

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    ...tsmEslintReact,
    {
        extends: [eslintPluginPrettierRecommended],
        rules: { 'prettier/prettier': 'warn' },
    },
])

export default eslintConfig
