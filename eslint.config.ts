import kdt from '@kdtlabs/eslint-config'

export default kdt({}, [
    {
        ignores: ['.nex/**', 'migrations/**'],
    },
    {
        rules: {
            'n/no-process-exit': 'off',
        },
    },
])
