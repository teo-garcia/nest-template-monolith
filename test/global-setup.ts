import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

import dotenv from 'dotenv'

export default async function globalSetup() {
  const rootDirectory = process.cwd()
  const envTestPath = path.resolve(rootDirectory, '.env.test')
  const prismaCli = path.resolve(
    rootDirectory,
    'node_modules',
    'prisma',
    'build',
    'index.js'
  )

  if (!existsSync(envTestPath)) {
    throw new Error(
      'Missing .env.test file. Copy .env.test.example to .env.test and adjust if needed.'
    )
  }

  process.env.DOTENV_CONFIG_PATH = envTestPath

  dotenv.config({ path: envTestPath })

  execFileSync(process.execPath, [prismaCli, 'generate'], { stdio: 'inherit' })
  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    stdio: 'inherit',
  })
}
