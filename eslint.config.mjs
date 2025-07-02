import sharedNode from '@teo-garcia/eslint-config-shared/node';
import jest from 'eslint-plugin-jest';
import globals from 'globals';
export default [
  ...sharedNode,
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
];
