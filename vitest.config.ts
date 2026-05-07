import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)', 'test/**/*.?(c|m)[jt]s?(x)'],
        exclude: [...configDefaults.exclude, 'test/helpers/**'],
        coverage: {
            provider: 'v8',
        },
    },
})
