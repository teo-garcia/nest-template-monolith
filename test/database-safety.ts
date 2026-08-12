import { existsSync } from 'node:fs'

export function requireTestDatabase(
  envTestPath: string,
  databaseUrl: string | undefined
) {
  if (!existsSync(envTestPath)) {
    throw new Error(
      'Missing .env.test file. Copy .env.test.example to .env.test before running database tests.'
    )
  }

  let databaseName = ''
  try {
    databaseName = decodeURIComponent(
      new URL(databaseUrl ?? '').pathname.split('/').filter(Boolean).at(-1) ??
        ''
    )
  } catch {
    // Report invalid and missing URLs through the same fail-closed error below.
  }

  if (!databaseName.endsWith('_test')) {
    throw new Error(
      `Refusing to run database tests against database ${JSON.stringify(databaseName)}. ` +
        "DATABASE_URL must point to a database whose name ends in '_test'."
    )
  }
}
