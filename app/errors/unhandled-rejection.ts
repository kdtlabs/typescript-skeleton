import { BaseError } from '@kdtlabs/utils'

export class UnhandledRejectionError extends BaseError {
    public declare readonly promise?: Promise<unknown>

    public withPromise(promise: Promise<unknown>) {
        return this.withValue('promise', promise)
    }
}
