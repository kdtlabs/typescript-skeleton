import { isEmpty, transform } from '@kdtlabs/utils'

export function env(key: string): string | undefined
export function env(key: string, defaultValue: string): string

export function env(key: string, defaultValue?: string) {
    return transform(process.env[key], (val) => (isEmpty(val) ? defaultValue : val))
}
