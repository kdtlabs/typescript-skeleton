import { LOG_LEVEL_NAMES } from '@kdtlabs/logger'
import { isInProduction, isTrueLike, resolvePath, transform } from '@kdtlabs/utils'
import { writableDirectory } from '@kdtlabs/utils/zod'
import z from 'zod'
import { storageDir } from '../utils/path'
import { env } from '../utils/process'

const isInProd = isInProduction()
const logLevel = z.enum(Object.values(LOG_LEVEL_NAMES))

export type LogLevel = z.infer<typeof logLevel>

const file = z.object({
    enabled: z.boolean().default(isInProd),
    level: logLevel.default('warn'),
    dir: writableDirectory().transform((val) => resolvePath(val)).default(env('LOGGER_DIR', storageDir('logs'))),
    interval: z.enum(['daily', 'hourly', 'monthly', 'weekly', 'yearly']).default('daily'),
    maxFiles: z.number().int().default(7),
})

const schema = z.object({
    level: logLevel.default(logLevel.parse(env('LOGGER_LEVEL', isInProd ? 'info' : 'debug'))),
    file: file.prefault({}),
    pretty: z.boolean().default(!isInProd),
    showName: z.boolean().default(isTrueLike(env('LOGGER_SHOW_NAME') ?? '0')),
    showPid: z.boolean().default(isTrueLike(env('LOGGER_SHOW_PID') ?? '0')),
    timeFormat: z.string().nonempty().default(isInProd ? 'HH:mm:ss.SSS yyyy/MM/dd' : 'HH:mm:ss.SSS'),
    filter: z.string().nonempty().default(env('LOGGER_FILTER', '*')),
    filterLevel: logLevel.nullish().default(transform(env('LOGGER_FILTER_LEVEL'), (v) => (v ? logLevel.parse(v) : null))),
})

export const logger = schema.prefault({})

export type LoggerConfig = z.infer<typeof logger>
