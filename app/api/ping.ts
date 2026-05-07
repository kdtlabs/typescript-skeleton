import z from 'zod'
import { defineApiRoute } from '../services/api/route'

export default defineApiRoute(
    {
        method: 'get',
        path: '/ping',
        description: 'Health check endpoint',
        response: {
            description: 'Server is healthy',
            schema: z.literal('pong'),
        },
        request: {},
    },
    (): 'pong' => 'pong',
)
