import { gracefulExit, indent, isExiting, isNumber, isObject } from '@kdtlabs/utils'
import { bgRedBright, bold, whiteBright } from 'colorette'
import z, { ZodError } from 'zod'
import { initConfig } from './core/config'
import { initDatabase } from './core/database'
import { getLogger, initLogger } from './core/logger'
import { initServer } from './core/server'
import { InvalidConfigError } from './errors/invalid-config'
import { UnhandledRejectionError } from './errors/unhandled-rejection'
import { buildApiRoutes } from './services/api/builder'

for (const signal of ['SIGTERM', 'SIGINT', 'SIGHUP']) {
    process.on(signal, () => {
        if (isExiting()) {
            return
        }

        process.stdout.write('\n')
        getLogger().info('Exiting...')
        gracefulExit()
    })
}

process.on('uncaughtException', (reason) => {
    try {
        getLogger().fatal(reason)
    } catch {
        console.error(reason)
    }

    process.exit(isObject(reason) && 'exitCode' in reason && isNumber(reason.exitCode) ? reason.exitCode : 1)
})

process.on('unhandledRejection', (error, promise) => {
    throw new UnhandledRejectionError('Unhandled rejection', { cause: error }).withPromise(promise)
})

const run = async () => {
    await initConfig().catch((error) => {
        if (error instanceof InvalidConfigError && error.cause && error.cause instanceof ZodError) {
            console.error(`${bgRedBright(whiteBright(bold(` Invalid Config `)))} ${error.message}`)
            console.error(indent(z.prettifyError(error.cause), 1))
            process.exit(1)
        }

        throw error
    })

    await initLogger()
    await initDatabase()
    await initServer(await buildApiRoutes(getLogger().child({ name: 'services:api' })))
}

run().catch((error) => process.nextTick(() => {
    throw error
}))
