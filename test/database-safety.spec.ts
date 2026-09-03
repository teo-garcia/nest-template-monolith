import path from 'node:path'

import { requireTestDatabase } from './database-safety.js'

const envTestExamplePath = path.resolve(process.cwd(), '.env.test.example')

describe('database test safety', () => {
  it('requires an explicit .env.test file', () => {
    expect(() =>
      requireTestDatabase(
        `${envTestExamplePath}.missing`,
        'postgresql://db/app_test'
      )
    ).toThrow(/Missing \.env\.test file/)
  })

  it('rejects a database without the test suffix', () => {
    expect(() =>
      requireTestDatabase(envTestExamplePath, 'postgresql://db/app')
    ).toThrow(/database "app"/)
  })

  it('accepts a test database with query parameters', () => {
    expect(() =>
      requireTestDatabase(
        envTestExamplePath,
        'postgresql://db/app_test?schema=public'
      )
    ).not.toThrow()
  })
})
