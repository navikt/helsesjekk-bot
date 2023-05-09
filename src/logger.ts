import pino from 'pino'

const logger = (defaultConfig = {}): pino.Logger =>
    pino({
        ...defaultConfig,
        level: 'debug',
        timestamp: false,
        formatters: {
            level: (label) => ({ level: label }),
            log: (object: Record<string, unknown>) => {
                if (object.err) {
                    const err = pino.stdSerializers.err(object.err as never)
                    object.stack_trace = err.stack
                    object.type = err.type
                    object.message = err.message
                    delete object.err
                }

                return object
            },
        },
    })

export default logger()
