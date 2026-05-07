import { describe, expect, test } from 'vitest'
import { setupTestApi } from '../helpers/api'

describe('GET /api/ping', () => {
    test('returns pong with success envelope', async () => {
        const api = await setupTestApi()
        const res = await api.request('/ping')

        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toEqual({ success: true, data: 'pong' })
    })

    test('rejects non-GET methods', async () => {
        const api = await setupTestApi()
        const res = await api.request('/ping', { method: 'POST' })

        expect(res.status).toBe(404)
    })
})
