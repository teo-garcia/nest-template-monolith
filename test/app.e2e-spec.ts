import { INestApplication } from '@nestjs/common'
import { RequestMethod } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'

import { AppModule } from '../src/app.module'
import { GlobalValidationPipe } from '../src/shared/pipes'

const trimSlashes = (value: string): string => {
  let start = 0
  let end = value.length

  while (start < end && value[start] === '/') {
    start += 1
  }

  while (end > start && value[end - 1] === '/') {
    end -= 1
  }

  return value.slice(start, end)
}

const toPublicApiPrefix = (value: string | undefined): string => {
  const normalized = trimSlashes(value || '/api')
  return normalized ? `/${normalized}` : ''
}

/**
 * E2E Tests
 *
 * Tests the entire application flow including:
 * - REST API endpoints for Tasks
 * - Health checks
 * - Metrics
 * - Input validation
 */
describe('AppController (e2e)', () => {
  let app: INestApplication<App>
  let apiPrefix = '/api'

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()

    // Apply same global configuration as main.ts
    const configService = app.get(ConfigService)
    apiPrefix = toPublicApiPrefix(
      configService.get<string>('config.app.apiPrefix')
    )

    if (apiPrefix) {
      app.setGlobalPrefix(apiPrefix.slice(1), {
        exclude: [
          '',
          { path: '', method: RequestMethod.GET },
          'health',
          'health/live',
          'health/ready',
          'metrics',
          'docs',
        ],
      })
    }

    // Apply global validation pipe (same as main.ts)
    app.useGlobalPipes(new GlobalValidationPipe())

    const appName =
      configService.get<string>('config.app.name') ?? 'NestJS Monolith Template'
    const appVersion = configService.get<string>('config.app.version') ?? '1'
    const swaggerConfig = new DocumentBuilder()
      .setTitle(appName)
      .setVersion(appVersion)
      .build()
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig)
    SwaggerModule.setup('docs', app, swaggerDocument)

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('Service Info', () => {
    it('/ (GET) should return service info', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'NestJS Monolith Template')
          expect(res.body).toHaveProperty('status', 'ok')
        })
    })
  })

  describe('Health Checks', () => {
    it('/health/live (GET) should return 200', () => {
      return request(app.getHttpServer())
        .get('/health/live')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok')
        })
    })

    it('/health/ready (GET) should check dependencies', () => {
      return request(app.getHttpServer())
        .get('/health/ready')
        .expect((res) => {
          expect([200, 503]).toContain(res.status)
          expect(res.body).toHaveProperty('checks.database')
          expect(res.body).toHaveProperty('checks.redis')
        })
    })

    it('/health (GET) should return comprehensive health', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect((res) => {
          expect([200, 503]).toContain(res.status)
          expect(res.body).toHaveProperty('status')
          expect(res.body).toHaveProperty('checks.database')
          expect(res.body).toHaveProperty('checks.redis')
        })
    })
  })

  describe('Docs', () => {
    it('/docs (GET) should expose Swagger UI', () => {
      return request(app.getHttpServer())
        .get('/docs')
        .redirects(1)
        .expect(200)
        .expect('Content-Type', /text\/html/)
        .expect((response) => {
          expect(response.text).toContain('Swagger UI')
        })
    })
  })

  describe('Metrics', () => {
    it('/metrics (GET) should return Prometheus metrics', () => {
      return request(app.getHttpServer())
        .get('/metrics')
        .expect(200)
        .expect('Content-Type', /text\/plain/)
        .expect((res) => {
          expect(res.text).toContain('http_requests_total')
          expect(res.text).toContain('http_request_duration_seconds')
        })
    })
  })

  describe('Tasks API', () => {
    let createdTaskId: string

    it('/api/tasks (GET) should return array (may be empty initially)', async () => {
      const response = await request(app.getHttpServer())
        .get(`${apiPrefix}/tasks`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
    })

    it('/api/tasks (POST) should create a task', async () => {
      const createTaskDto = {
        title: 'Test Task',
        description: 'This is a test task',
        priority: 5,
      }

      const response = await request(app.getHttpServer())
        .post(`${apiPrefix}/tasks`)
        .send(createTaskDto)
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('title', createTaskDto.title)
      expect(response.body).toHaveProperty(
        'description',
        createTaskDto.description
      )
      expect(response.body).toHaveProperty('priority', createTaskDto.priority)
      expect(response.body).toHaveProperty('status', 'PENDING')

      createdTaskId = response.body.id
    })

    it('/api/tasks (POST) should validate input - missing title', async () => {
      const response = await request(app.getHttpServer())
        .post(`${apiPrefix}/tasks`)
        .send({
          description: 'Task without title',
        })
        .expect(422)

      expect(response.body).toHaveProperty('message')
      expect(response.body).toHaveProperty('errors')
    })

    it('/api/tasks (POST) should validate input - invalid priority', async () => {
      const response = await request(app.getHttpServer())
        .post(`${apiPrefix}/tasks`)
        .send({
          title: 'Test Task',
          priority: 15, // Max is 10
        })
        .expect(422)

      expect(response.body).toHaveProperty('message')
      expect(response.body).toHaveProperty('errors')
    })

    it('/api/tasks (POST) should validate input - invalid status', async () => {
      const response = await request(app.getHttpServer())
        .post(`${apiPrefix}/tasks`)
        .send({
          title: 'Test Task',
          status: 'INVALID_STATUS',
        })
        .expect(422)

      expect(response.body).toHaveProperty('message')
      expect(response.body).toHaveProperty('errors')
    })

    it('/api/tasks/:id (GET) should return a task', async () => {
      const response = await request(app.getHttpServer())
        .get(`${apiPrefix}/tasks/${createdTaskId}`)
        .expect(200)

      expect(response.body).toHaveProperty('id', createdTaskId)
      expect(response.body).toHaveProperty('title', 'Test Task')
    })

    it('/api/tasks/:id (GET) should return 404 for non-existent task', async () => {
      const response = await request(app.getHttpServer())
        .get(`${apiPrefix}/tasks/non_existent_id`)
        .expect(404)

      expect(response.body).toHaveProperty('message')
      expect(response.body).toHaveProperty('statusCode', 404)
    })

    it('/api/tasks/:id (PATCH) should update a task', async () => {
      const updateTaskDto = {
        title: 'Updated Task Title',
        status: 'IN_PROGRESS',
      }

      const response = await request(app.getHttpServer())
        .patch(`${apiPrefix}/tasks/${createdTaskId}`)
        .send(updateTaskDto)
        .expect(200)

      expect(response.body).toHaveProperty('id', createdTaskId)
      expect(response.body).toHaveProperty('title', updateTaskDto.title)
      expect(response.body).toHaveProperty('status', updateTaskDto.status)
    })

    it('/api/tasks/:id (PATCH) should return 404 for non-existent task', async () => {
      const response = await request(app.getHttpServer())
        .patch(`${apiPrefix}/tasks/non_existent_id`)
        .send({ title: 'New Title' })
        .expect(404)

      expect(response.body).toHaveProperty('statusCode', 404)
    })

    it('/api/tasks?status=IN_PROGRESS (GET) should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get(`${apiPrefix}/tasks?status=IN_PROGRESS`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      for (const task of response.body) {
        expect(task.status).toBe('IN_PROGRESS')
      }
    })

    it('/api/tasks?priority=5 (GET) should filter by priority', async () => {
      const response = await request(app.getHttpServer())
        .get(`${apiPrefix}/tasks?priority=5`)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      for (const task of response.body) {
        expect(task.priority).toBeGreaterThanOrEqual(5)
      }
    })

    it('/api/tasks/:id (DELETE) should delete a task', async () => {
      await request(app.getHttpServer())
        .delete(`${apiPrefix}/tasks/${createdTaskId}`)
        .expect(204)
        .expect((response) => {
          expect(response.text).toBe('')
        })
    })

    it('/api/tasks/:id (GET) should return 404 after deletion', async () => {
      const response = await request(app.getHttpServer())
        .get(`${apiPrefix}/tasks/${createdTaskId}`)
        .expect(404)

      expect(response.body).toHaveProperty('statusCode', 404)
    })

    it('/api/tasks/:id (DELETE) should return 404 for non-existent task', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${apiPrefix}/tasks/non_existent_id`)
        .expect(404)

      expect(response.body).toHaveProperty('statusCode', 404)
    })
  })
})
