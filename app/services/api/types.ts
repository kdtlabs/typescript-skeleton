import type { RouteConfig } from '@asteasolutions/zod-to-openapi'
import type { Awaitable } from '@kdtlabs/utils'
import type { Context, Input } from 'hono'
import type { BlankEnv } from 'hono/types'
import type { ZodObject, ZodType } from 'zod'
import type z from 'zod'

export interface ApiRouteResponse<S extends ZodType = ZodType> {
    description: string
    schema: S
    validate?: boolean
    example?: z.infer<S>
    examples?: Record<string, z.infer<S>>
}

export type ApiRouteRequest = Omit<NonNullable<RouteConfig['request']>, 'body'> & {
    params?: ZodObject
    query?: ZodObject
    cookies?: ZodObject
    headers?: ZodObject
    body?: ZodType
}

export type BuildInput<T extends ApiRouteRequest> = Input & {
    out: {
        json: z.infer<T['body']>
        query: z.infer<T['query']>
        param: z.infer<T['params']>
        header: z.infer<T['headers']>
        cookie: z.infer<T['cookies']>
    }
}

type OmittedRouteConfigKeys = 'callbacks' | 'externalDocs' | 'parameters' | 'request' | 'requestBody' | 'responses' | 'servers'

export type ApiRoute<TRoute extends RouteConfig = RouteConfig, TRequest extends ApiRouteRequest = ApiRouteRequest, TResponse extends ApiRouteResponse = ApiRouteResponse> = Omit<TRoute, OmittedRouteConfigKeys> & {
    request: TRequest
    response: TResponse
}

export type ApiRouteContext<T extends ApiRoute> = Context<BlankEnv, T['path'], BuildInput<T['request']>>

export type ApiRouteHandler<T extends ApiRoute> = (context: ApiRouteContext<T>) => Awaitable<z.infer<T['response']['schema']>>
