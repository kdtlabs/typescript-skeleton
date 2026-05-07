import { isInProduction, isTrueLike } from '@kdtlabs/utils'
import z from 'zod'
import { env } from '../utils/process'

const isInProd = isInProduction()

const logger = z.object({
    showRequest: z.boolean().default(isTrueLike(env('SERVER_SHOW_REQUEST_LOG', '0'))),
    showHeaders: z.boolean().default(isTrueLike(env('SERVER_LOG_HEADERS', '0'))),
})

const schema = z.object({
    host: z.string().nonempty().default(env('APP_HOST', isInProd ? '127.0.0.1' : '0.0.0.0')),
    port: z.number().int().min(0).max(65_535).default(Number(env('APP_PORT', '3000'))),
    development: z.boolean().default(!isInProd),
    logger: logger.prefault({}),
    corsOrigin: z.union([z.string().nonempty(), z.string().nonempty().array()]).default('*'),
})

export const server = schema.prefault({})

export type ServerConfig = z.infer<typeof schema>
