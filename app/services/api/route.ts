import type { RouteConfig } from '@asteasolutions/zod-to-openapi'
import type { ApiRoute, ApiRouteHandler } from './types'
import { isPlainObject } from '@kdtlabs/utils'
import { toOpenAPIRouteConfig } from './utils'

export const API_ROUTE_CONFIG = Symbol('API_ROUTE_CONFIG')

export interface ApiRouteConfig {
    [API_ROUTE_CONFIG]: true
    route: ApiRoute
    openapi: RouteConfig
    handler: ApiRouteHandler<ApiRoute>
}

export const isApiRouteConfig = (value: unknown): value is ApiRouteConfig => isPlainObject(value) && API_ROUTE_CONFIG in value

export const defineApiRoute = <T extends ApiRoute>(route: T, handler: ApiRouteHandler<T>): ApiRouteConfig => ({
    [API_ROUTE_CONFIG]: true,
    openapi: toOpenAPIRouteConfig(route),
    handler,
    route,
})
