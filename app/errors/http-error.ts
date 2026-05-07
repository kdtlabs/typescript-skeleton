import { BaseError } from '@kdtlabs/utils'

export class HttpError extends BaseError {
    public declare status?: number
    public declare headers?: Record<string, string>
    public declare data?: unknown
    public declare request?: Request
    public declare response?: Response

    public withStatus(status: number) {
        return this.withValue('status', status)
    }

    public withHeaders(headers: NonNullable<ConstructorParameters<typeof Headers>[0]>) {
        return this.withValue('headers', Object.fromEntries(new Headers(headers).entries()))
    }

    public withData(data: unknown) {
        return this.withValue('data', data)
    }

    public withRequest(request: Request) {
        return this.withValue('request', request)
    }

    public withResponse(response: Response) {
        return this.withValue('response', response)
    }

    public toResponse() {
        if (this.response) {
            return this.response
        }

        return Response.json({ success: false, message: this.message, ...(this.data ? { data: this.data } : {}) }, {
            status: this.status,
            headers: this.headers,
        })
    }
}
