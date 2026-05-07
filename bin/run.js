#!/usr/bin/env node
import { register } from 'node:module'
import 'dotenv/config'

register('@swc-node/register/esm-register', new URL('../', import.meta.url))

import('../app/main.ts').catch((error) => {
    throw error
})
