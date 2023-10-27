/** @type {import('tailwindcss').Config} */
module.exports = {
    presets: [require('@navikt/ds-tailwind')],
    content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        extend: {},
    },
    plugins: [],
}
