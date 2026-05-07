import { BaseError } from '@kdtlabs/utils'

export class InvalidConfigError extends BaseError {
    public declare readonly path?: string

    public withPath(path: string) {
        return this.withValue('path', path)
    }
}
