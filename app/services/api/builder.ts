import { OpenApiGeneratorV3, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { highlight, type Logger, timer } from '@kdtlabs/logger'
import { ensurePrefix } from '@kdtlabs/utils'
import { Glob } from 'glob'
import { Hono } from 'hono'
import { appDir } from '../../utils/path'
import { isApiRouteConfig } from './route'
import { createRequestValidator } from './utils'

export async function buildApiRoutes(logger: Logger) {
    logger.info(`Building API routes...`)

    const start = process.hrtime.bigint()
    const dir = appDir('api')
    const glob = new Glob('**/*.ts', { cwd: dir, absolute: true, nodir: true, ignore: ['**/*.{test,spec}.ts', '**/_*.ts'] })

    const openapiRegistry = new OpenAPIRegistry()
    const app = new Hono()
    const paths = new Set<string>()

    for await (const file of glob) {
        const exported = await import(file).then((m) => m.default)

        if (exported instanceof Hono) {
            app.route('/', exported)

            for (const route of exported.routes) {
                paths.add(`${route.method}:${route.path}`)
            }

            continue
        }

        const config = isApiRouteConfig(exported) ? exported : undefined

        if (!config) {
            continue
        }

        const routeKey = `${config.route.method}:${config.route.path}`

        if (paths.has(routeKey)) {
            throw new Error(`Duplicate API route: ${config.route.method.toUpperCase()} ${config.route.path}`)
        }

        openapiRegistry.registerPath({ ...config.openapi, path: `/api${ensurePrefix(config.openapi.path, '/')}` })

        app.on(config.route.method, [config.route.path], createRequestValidator(config.route.request), async (c) => {
            const data = await config.handler(c)

            if (config.route.response.validate) {
                return c.json({ success: true, data: config.route.response.schema.parse(data) })
            }

            return c.json({ success: true, data })
        })

        paths.add(routeKey)
    }

    logger.info(`Found ${highlight(String(paths.size))} routes`, timer(start))

    const generator = new OpenApiGeneratorV3(
        openapiRegistry.definitions,
    )

    app.get('/', (c) => {
        const docs = generator.generateDocument({
            openapi: '3.0.0',
            info: {
                title: 'API Documentation',
                version: '1.0.0',
            },
        })

        return c.json(docs, 200)
    })

    return { '/api': app }
}
