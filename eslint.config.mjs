import base from '@teo-garcia/eslint-config-shared/base'
import node from '@teo-garcia/eslint-config-shared/node'
import vitest from '@vitest/eslint-plugin'
import { defineConfig } from 'eslint/config'
import globals from 'globals'

export default defineConfig([
  ...base,
  ...node,
  {
    ignores: ['src/generated/**', 'prisma.config.ts'],
  },
  {
    files: [
      '**/*.test.{js,ts}',
      '**/*.spec.{js,ts}',
      '**/test/**/*',
      '**/tests/**/*',
    ],
    plugins: { vitest },
    rules: { ...vitest.configs.recommended.rules },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest,
      },
    },
  },
])
