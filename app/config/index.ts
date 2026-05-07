import z from 'zod'
import { logger } from './logger'
import { server } from './server'

const env = z.record(z.string(), z.string()).default({})

export const configSchema = z.object({
    env,
    logger,
    server,
})

export type AppConfig = z.infer<typeof configSchema>
