/** @type {import('tailwindcss').Config} */
module.exports = {
    presets: [require('@navikt/ds-tailwind')],
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
