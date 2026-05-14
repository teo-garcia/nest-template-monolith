import base from '@teo-garcia/eslint-config-shared/base'
import node from '@teo-garcia/eslint-config-shared/node'
import { defineConfig } from 'eslint/config'
import jest from 'eslint-plugin-jest'
import globals from 'globals'

export default defineConfig([
  ...base,
  ...node,
  {
    ignores: ['src/generated/**', 'prisma.config.ts'],
  },
  {
    files: ['prisma/seed.ts'],
    rules: {
      'unicorn/prefer-top-level-await': 'off',
    },
  },
  {
    files: [
      '**/*.test.{js,ts}',
      '**/*.spec.{js,ts}',
      '**/test/**/*',
      '**/tests/**/*',
    ],
    plugins: {
      jest,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      ...jest.configs.recommended.rules,
    },
  },
])
