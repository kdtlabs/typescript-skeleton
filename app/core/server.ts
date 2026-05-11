import type { ServerConfig } from '../config/server'
import { promisify } from 'node:util'
import { serve, type ServerType } from '@hono/node-server'
import { type Logger, LogLevel } from '@kdtlabs/logger'
import { createHonoLogger } from '@kdtlabs/logger/hono'
import { addExitHandler, BaseError, entries, isExiting, isInProduction, serialize, transform } from '@kdtlabs/utils'
import { type Context, Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import z, { ZodError } from 'zod'
import { HttpError } from '../errors/http-error'
import { getConfig } from './config'
import { getLogger } from './logger'

const isInProd = isInProduction()

export const getRequestData = (c: Context) => ({
    method: c.req.method,
    path: c.req.path,
    param: c.req.param(),
    queries: c.req.queries(),
})

const handleError = (logger: Logger, error: unknown, c: Context) => {
    const logError = () => logger.error(error, { request: getRequestData(c) })

    if (error instanceof HTTPException) {
        if (error.status && error.status >= 500) {
            logError()
        }

        return error.getResponse()
    }

    if (error instanceof ZodError) {
        return c.json({ success: false, message: 'Validation Failed', data: z.treeifyError(error) }, 422)
    }

    if (error instanceof HttpError) {
        if (error.status && error.status >= 500) {
            logError()
        }

        return error.toResponse()
    }

    logError()

    if (error instanceof TypeError) {
        return c.json({ success: false, message: error.message }, 400)
    }

    if (!isInProd) {
        return c.json({ success: false, message: 'Internal Error', data: serialize(error) }, 500)
    }

    return c.json({ success: false, message: 'Internal Error' }, 500)
}

const getServerLoggerMetadata = (type: 'request' | 'response', mode: 'double' | 'single', config: ServerConfig, c: Context) => {
    const metadata: Record<string, unknown> = {}

    if (config.logger.showHeaders) {
        if (type === 'request' || mode === 'single') {
            metadata.headers = Object.fromEntries(c.req.raw.headers.entries())
        }

        if (type === 'response') {
            metadata.responseHeader = Object.fromEntries(c.res.headers.entries())
        }
    }

    return metadata
}

const getServerLogger = (config: ServerConfig, logger: Logger) => transform(config.logger.showRequest ? 'double' : 'single', (mode: 'double' | 'single') => createHonoLogger(logger, {
    mode,
    level: LogLevel.Trace,
    levelResolver: (_, c) => (c.res.status >= 500 ? LogLevel.Info : undefined),
    requestMetadata: (c) => getServerLoggerMetadata('request', mode, config, c),
    responseMetadata: (c) => getServerLoggerMetadata('response', mode, config, c),
}))

let _hono: Hono | undefined
let _server: ServerType | undefined

export function getHono() {
    if (!_hono) {
        throw new BaseError('Hono not initialized')
    }

    return _hono
}

export function getServer() {
    if (!_server) {
        throw new BaseError('Server not initialized')
    }

    return _server
}

export async function initServer(routes: Record<string, Hono> = {}) {
    const config = getConfig('server')
    const logger = getLogger().child({ name: 'server' })
    const hono = _hono = new Hono()

    hono.onError((error, c) => {
        return handleError(logger, error, c)
    })

    hono.use(async (c, next) => {
        if (isExiting()) {
            return c.json({ success: false, message: 'Server is shutting down' }, 503)
        }

        return next()
    })

    hono.use(getServerLogger(config, logger))
    hono.use(cors({ origin: config.corsOrigin }))

    for (const [path, route] of entries(routes)) {
        hono.route(path, route)
    }

    hono.notFound(() => {
        throw new HttpError('Not Found').withStatus(404)
    })

    const server = _server = serve({ hostname: config.host, port: config.port, fetch: hono.fetch }, (info) => {
        logger.info(`Server listening at http://${info.address}:${info.port}`)
    })

    addExitHandler(async () => {
        const promise = promisify(server.close.bind(server))().catch((error) => logger.error('Failed to stop server', error))

        if ('closeIdleConnections' in server) {
            server.closeIdleConnections()
        }

        if ('closeAllConnections' in server) {
            server.closeAllConnections()
        }

        await promise.then(() => logger.info('Server stopped!'))
    })
}
