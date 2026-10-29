export class NoResultError extends Error {
    constructor(what: string) {
        super(`No record was found for ${what}`)
        this.name = 'NoResultError'
    }
}
