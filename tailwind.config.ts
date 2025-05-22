import type { Config } from 'tailwindcss'
import navikt from '@navikt/ds-tailwind'

const config: Config = {
    presets: [navikt],
    content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        extend: {
            gridTemplateColumns: {
                26: 'repeat(26, minmax(0, 1fr))',
            },
        },
    },
    plugins: [],
}
export default config
