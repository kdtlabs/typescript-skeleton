import { pwd } from '@kdtlabs/utils'

export const rootDir = (...path: string[]) => pwd(import.meta, '../..', ...path)
export const appDir = (...path: string[]) => rootDir('app', ...path)
export const storageDir = (...path: string[]) => rootDir('storage', ...path)
