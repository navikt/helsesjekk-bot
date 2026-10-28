import config from '@navikt/tsm-oxfmt'
import { defineConfig } from 'oxfmt'

export default defineConfig({
    ...config,
    ignorePatterns: ['src/features/ny-sykmelding-form/summary/rules/rule-texts.ts', '.yarn'],
})
