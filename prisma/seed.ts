import 'dotenv/config'

import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

import { PrismaClient, TaskStatus } from '../src/generated/prisma/client'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database')
}

const pool = new Pool({
  connectionString: databaseUrl,
})

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
  errorFormat: 'colorless',
})

const seedTasks = [
  {
    title: 'Review onboarding checklist',
    description: 'Confirm the template health, docs, metrics, and task APIs.',
    status: TaskStatus.PENDING,
    priority: 3,
  },
  {
    title: 'Ship API contract polish',
    description: 'Validate pagination, errors, and OpenAPI schema examples.',
    status: TaskStatus.IN_PROGRESS,
    priority: 7,
  },
  {
    title: 'Archive completed setup',
    description: 'Keep a completed task available for filtering examples.',
    status: TaskStatus.COMPLETED,
    priority: 1,
  },
]

async function main(): Promise<void> {
  await prisma.task.deleteMany()
  await prisma.task.createMany({ data: seedTasks })
}

main()
  .then(() => {
    console.log(`Seeded ${seedTasks.length} tasks`)
  })
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
