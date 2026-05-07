import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { entries } from '@kdtlabs/utils'
import JSON5 from 'json5'
import { type AppConfig, configSchema } from '../config'
import { InvalidConfigError } from '../errors/invalid-config'
import { rootDir } from '../utils/path'

export async function getConfigFileContent(dir: string) {
    const basePath = join(dir, 'config.json')

    if (existsSync(`${basePath}5`)) {
        const json5 = await readFile(`${basePath}5`, 'utf8')

        if (json5) {
            return { content: json5, path: `${basePath}5` }
        }
    }

    if (existsSync(basePath)) {
        return { content: await readFile(basePath, 'utf8'), path: basePath }
    }

    return { content: '{}', path: basePath }
}

let config: AppConfig | undefined

export async function initConfig() {
    const { content, path } = await getConfigFileContent(rootDir())
    const result = configSchema.safeParse(JSON5.parse(content))

    if (!result.success) {
        throw new InvalidConfigError('Config file contains invalid or missing fields', { cause: result.error }).withPath(path)
    }

    for (const [key, value] of entries(result.data.env)) {
        process.env[key] = value
    }

    config = result.data
}

export function getConfig(): AppConfig
export function getConfig<T extends keyof AppConfig>(key: T): AppConfig[T]

export function getConfig(key?: keyof AppConfig) {
    if (!config) {
        throw new InvalidConfigError('Config is not initialized')
    }

    return key ? config[key] : config
}
