import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    out: './migrations',
    schema: './app/database/schemas',
    dialect: 'sqlite',
    casing: 'snake_case',
    dbCredentials: {
        url: './storage/app.db',
    },
})
