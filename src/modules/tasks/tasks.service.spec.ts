import { NotFoundException } from '@nestjs/common'

import { Task, TaskStatus } from '../../generated/prisma/client'
import { PrismaService } from '../../shared/prisma'
import { TasksService } from './tasks.service'

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Write tests',
  description: null,
  status: TaskStatus.PENDING,
  priority: 0,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
})

describe('TasksService', () => {
  const taskClient = {
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  }
  const transaction = jest.fn()
  const prisma = {
    task: taskClient,
    $transaction: transaction,
  } as unknown as PrismaService
  const service = new TasksService(prisma)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('applies domain defaults when creating a task', async () => {
    const created = makeTask()
    taskClient.create.mockResolvedValue(created)

    await expect(service.create({ title: 'Write tests' })).resolves.toBe(
      created
    )
    expect(taskClient.create).toHaveBeenCalledWith({
      data: {
        title: 'Write tests',
        description: undefined,
        status: TaskStatus.PENDING,
        priority: 0,
      },
    })
  })

  it('builds filters, ordering, and pagination at the persistence boundary', async () => {
    const result = makeTask({ priority: 7, status: TaskStatus.IN_PROGRESS })
    taskClient.count.mockResolvedValue(4)
    taskClient.findMany.mockResolvedValue([result])
    transaction.mockResolvedValue([4, [result]])

    await expect(
      service.findAll({
        status: TaskStatus.IN_PROGRESS,
        priority: 5,
        page: 3,
        pageSize: 10,
      })
    ).resolves.toEqual({
      data: [result],
      meta: { total: 4, page: 3, pageSize: 10 },
    })
    const where = {
      status: TaskStatus.IN_PROGRESS,
      priority: { gte: 5 },
    }
    expect(taskClient.count).toHaveBeenCalledWith({ where })
    expect(taskClient.findMany).toHaveBeenCalledWith({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      skip: 20,
      take: 10,
    })
  })

  it('rejects a missing task with a domain-specific not-found error', async () => {
    taskClient.findUnique.mockResolvedValue(null)

    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException)
    expect(taskClient.findUnique).toHaveBeenCalledWith({
      where: { id: 'missing' },
    })
  })

  it('checks existence before applying a partial update', async () => {
    const existing = makeTask()
    const updated = makeTask({ status: TaskStatus.COMPLETED })
    taskClient.findUnique.mockResolvedValue(existing)
    taskClient.update.mockResolvedValue(updated)

    await expect(
      service.update(existing.id, { status: TaskStatus.COMPLETED })
    ).resolves.toBe(updated)
    expect(taskClient.update).toHaveBeenCalledWith({
      where: { id: existing.id },
      data: { status: TaskStatus.COMPLETED },
    })
  })

  it('checks existence before deleting a task', async () => {
    const existing = makeTask()
    taskClient.findUnique.mockResolvedValue(existing)
    taskClient.delete.mockResolvedValue(existing)

    await expect(service.remove(existing.id)).resolves.toBeUndefined()
    expect(taskClient.delete).toHaveBeenCalledWith({
      where: { id: existing.id },
    })
  })
})
