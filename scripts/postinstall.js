/* eslint-disable */

const isCi = process.env.CI !== undefined
const isProduction = process.env.NODE_ENV === 'production'

if (!(isCi || isProduction)) {
    require('husky').install()
}
