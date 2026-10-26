import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    setupFiles: ['dotenv/config'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    teardownTimeout: 10_000,
    fileParallelism: false,
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage/e2e',
      include: ['src/**/*.{ts,js}'],
      exclude: [
        'src/generated/**',
        'src/**/*.spec.ts',
        'src/**/*.d.ts',
        'src/main.ts',
        'src/telemetry.ts',
      ],
    },
  },
})
