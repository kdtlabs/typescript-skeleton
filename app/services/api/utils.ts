import type { MiddlewareHandler } from 'hono'
import type { ApiRoute, ApiRouteRequest } from './types'
import { extendZodWithOpenApi, type RouteConfig } from '@asteasolutions/zod-to-openapi'
import { type AnyObject, map, notUndefined } from '@kdtlabs/utils'
import { getCookie } from 'hono/cookie'
import z from 'zod'
import { HttpError } from '../../errors/http-error'

extendZodWithOpenApi(z)

export const toExamplesObject = (examples: Record<string, unknown>) => map(examples, (k, value) => [k, { value: { success: true, data: value } }])

export const wrapResponseSchema = (schema: z.ZodType) => z.object({
    success: z.boolean(),
    data: schema,
})

export const toOpenAPIRouteConfig = ({ request: req, response: res, ...rest }: ApiRoute): RouteConfig => ({
    ...rest,
    request: {
        ...req,
        body: req.body ? { content: { 'application/json': { schema: req.body } } } : undefined,
    },
    responses: {
        200: {
            description: res.description,
            content: {
                'application/json': {
                    schema: wrapResponseSchema(res.schema),
                    ...(notUndefined(res.example) && { example: { success: true, data: res.example } }),
                    ...(notUndefined(res.examples) && { examples: toExamplesObject(res.examples) }),
                },
            },
        },
    },
})

export const createRequestValidator = (request: ApiRouteRequest): MiddlewareHandler => async (c, next) => {
    if (request.body) {
        const contentType = c.req.header('content-type')?.toLowerCase() ?? ''

        if (!contentType.includes('application/json')) {
            throw new HttpError('Expected Content-Type: application/json').withStatus(415)
        }

        let body: unknown

        try {
            body = await c.req.json()
        } catch {
            throw new HttpError('Invalid JSON body').withStatus(400)
        }

        c.req.addValidatedData('json', request.body.parse(body) as AnyObject)
    }

    if (request.query) {
        c.req.addValidatedData('query', request.query.parse(c.req.query()))
    }

    if (request.params) {
        c.req.addValidatedData('param', request.params.parse(c.req.param()))
    }

    if (request.headers) {
        c.req.addValidatedData('header', request.headers.parse(c.req.header()))
    }

    if (request.cookies) {
        c.req.addValidatedData('cookie', request.cookies.parse(getCookie(c)))
    }

    await next()
}
