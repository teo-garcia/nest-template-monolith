import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

export default async function globalSetup() {
  const envTestPath = resolve(__dirname, '..', '.env.test')

  if (!existsSync(envTestPath)) {
    throw new Error(
      'Missing .env.test file. Copy .env.test.example to .env.test and adjust if needed.',
    )
  }

  process.env.DOTENV_CONFIG_PATH = envTestPath

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config({ path: envTestPath })

  execSync('pnpm db:generate', { stdio: 'inherit' })
  execSync('pnpm db:deploy', { stdio: 'inherit' })
}
