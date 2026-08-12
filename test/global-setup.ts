import { execFileSync } from 'node:child_process'
import path from 'node:path'

import dotenv from 'dotenv'

import { requireTestDatabase } from './database-safety'

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

  process.env.DOTENV_CONFIG_PATH = envTestPath

  dotenv.config({ path: envTestPath })
  requireTestDatabase(envTestPath, process.env.DATABASE_URL)

  execFileSync(process.execPath, [prismaCli, 'generate'], { stdio: 'inherit' })
  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    stdio: 'inherit',
  })
}
