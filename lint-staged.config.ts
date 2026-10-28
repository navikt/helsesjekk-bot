import type { Configuration } from 'lint-staged'

const config: Configuration = {
    '*': () => 'yarn fmt --no-error-on-unmatched-pattern',
    '*.{ts,tsx,js,ts,mjs,mts}': 'yarn lint --fix --max-warnings=0',
    '*.{ts,tsx}': () => 'yarn tsc',
}

export default config
