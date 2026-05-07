import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { LogLevel, timer } from '@kdtlabs/logger'
import { createDrizzleLogger } from '@kdtlabs/logger/drizzle'
import { addExitHandler, BaseError, ensureDirectory } from '@kdtlabs/utils'
import Database from 'better-sqlite3'
import { type BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from '../database/schemas'
import { rootDir, storageDir } from '../utils/path'
import { getLogger } from './logger'

let database: BetterSQLite3Database<typeof schema> | undefined

export function getDatabase() {
    if (!database) {
        throw new BaseError('Database not initialized')
    }

    return database
}

export async function initDatabase() {
    const start = process.hrtime.bigint()
    const logger = getLogger().child({ name: 'database' })

    logger.info('Initializing database...')

    const dir = storageDir()
    const path = join(dir, 'app.db')

    ensureDirectory(dir, { recursive: true })

    const sqlite = new Database(path)
    const db = drizzle({ client: sqlite, schema, logger: createDrizzleLogger(logger, { level: LogLevel.Trace }), casing: 'snake_case' })

    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('foreign_keys = ON')

    addExitHandler(async () => {
        sqlite.pragma('wal_checkpoint(TRUNCATE)')
        sqlite.close()
    })

    const migrationsDir = rootDir('migrations')
    const migrationsMeta = join(migrationsDir, 'meta/_journal.json')

    if (existsSync(migrationsMeta)) {
        migrate(db, { migrationsFolder: migrationsDir })
    }

    database = db
    logger.info('Database initialized', timer(start))
}
