import type { LoggerConfig } from '../config/logger'
import { createAsyncTransport, createCombineTransport, createConsoleTransport, createDefaultConsoleFormatter, createFileTransport, createFilteredTransport, createLevelFilter, createNameFilter, createPrettyFormatter, createResolveTransformer, LogLevel, type LogTransport, NonBlockingLogger } from '@kdtlabs/logger'
import { addExitHandler, BaseError, invoke } from '@kdtlabs/utils'
import { getConfig } from './config'

export const getLoggerFormatter = (config: LoggerConfig) => {
    if (config.pretty) {
        return createPrettyFormatter({ showName: config.showName, showPid: config.showPid, timeFormat: config.timeFormat })
    }

    return createDefaultConsoleFormatter()
}

export const getLoggerTransport = (config: LoggerConfig) => {
    const flushFns: Array<() => Promise<void>> = []

    const transports: Record<string, LogTransport<any>> = {
        console: createConsoleTransport({ formatter: getLoggerFormatter(config) }),
    }

    if (config.file.enabled) {
        const file = createFileTransport({
            dir: config.file.dir,
            rotate: {
                interval: config.file.interval,
                maxFiles: config.file.maxFiles,
            },
        })

        const { transport, flush } = createAsyncTransport({ file }, {
            onError: (errors, _, logger) => {
                for (const { error, transport } of errors) {
                    transports.console({ timestamp: Date.now(), level: LogLevel.Error, message: `Failed to write log to transport: ${transport}`, metadata: { errors: [error] } }, logger)
                }
            },
        })

        transports['file'] = createFilteredTransport(transport, [createLevelFilter(config.file.level)])
        flushFns.push(flush)
    }

    const flush = async () => {
        await Promise.allSettled(flushFns.map(invoke))
    }

    return { transport: createCombineTransport(transports), flush }
}

let logger: NonBlockingLogger | undefined

export function getLogger() {
    if (!logger) {
        throw new BaseError('Logger is not initialized')
    }

    return logger
}

export async function initLogger() {
    const config = getConfig('logger')
    const nameFilter = createNameFilter(config.filter, config.filterLevel ?? undefined)

    const { transport, flush } = getLoggerTransport(config)

    addExitHandler(async () => {
        await flush()
    })

    logger = new NonBlockingLogger(transport, {
        level: config.level,
        filters: [nameFilter],
        transformers: [createResolveTransformer()],
    })

    process.on('exit', () => {
        logger?.drain()
    })

    await new Promise(setImmediate)
}
