import type { Logger } from '@kdtlabs/logger'
import type { Hono } from 'hono'
import { buildApiRoutes } from '../../app/services/api/builder'

const noop = () => {}
const stubLogger = { trace: noop, debug: noop, info: noop, warn: noop, error: noop, fatal: noop, child: () => stubLogger } as unknown as Logger

export const setupTestApi = async (): Promise<Hono> => {
    const routes = await buildApiRoutes(stubLogger)
    const api = routes['/api']

    if (!api) {
        throw new Error('/api routes not built')
    }

    return api
}
