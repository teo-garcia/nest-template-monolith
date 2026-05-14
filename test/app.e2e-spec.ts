import { INestApplication } from '@nestjs/common'
import { RequestMethod } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'

import { AppModule } from '../src/app.module'
import { GlobalExceptionFilter } from '../src/shared/filters'
import {
  RequestIdInterceptor,
  TransformInterceptor,
} from '../src/shared/interceptors'
import { MetricsInterceptor } from '../src/shared/metrics'
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

interface TaskResponse {
  id: string
  title: string
  description?: string
  priority: number
  status: string
}

interface PaginatedTaskResponse {
  data: TaskResponse[]
  meta: {
    total: number
    page: number
    pageSize: number
  }
}

const dataOf = <T>(body: { data: T }): T => body.data

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
    process.env.DOCS_ENABLED = 'true'
    process.env.METRICS_ENABLED = 'true'

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

    // Apply global request/error boundary setup (same as main.ts)
    app.useGlobalPipes(new GlobalValidationPipe())
    app.useGlobalFilters(new GlobalExceptionFilter())

    const appName =
      configService.get<string>('config.app.name') ?? 'NestJS Monolith Template'
    const appVersion = configService.get<string>('config.app.version') ?? '1'
    const docsEnabled =
      configService.get<boolean>('config.docs.enabled') ?? true
    const openApiServerUrl =
      configService.get<string>('config.docs.serverUrl') ??
      'http://localhost:3001'

    const swaggerConfig = new DocumentBuilder()
      .setTitle(appName)
      .setVersion(appVersion)
      .addServer(openApiServerUrl)
      .build()
    if (docsEnabled) {
      const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig)
      SwaggerModule.setup('docs', app, swaggerDocument)
    }

    app.useGlobalInterceptors(
      new RequestIdInterceptor(),
      new TransformInterceptor(configService),
      app.get(MetricsInterceptor)
    )

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
          const data = dataOf<{ name: string; status: string }>(res.body)

          expect(data).toHaveProperty('name', 'NestJS Monolith Template')
          expect(data).toHaveProperty('status', 'ok')
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
          expect(res.headers).not.toHaveProperty('x-ratelimit-limit')
        })
    })

    it('/health/ready (GET) should check dependencies', () => {
      return request(app.getHttpServer())
        .get('/health/ready')
        .expect((res) => {
          expect([200, 503]).toContain(res.status)
          const details = {
            ...res.body.info,
            ...res.body.error,
          }
          expect(details).toHaveProperty('database')
          expect(details).toHaveProperty('redis')
        })
    })

    it('/health (GET) should return comprehensive health', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect((res) => {
          expect([200, 503]).toContain(res.status)
          expect(res.body).toHaveProperty('status')
          const details = {
            ...res.body.info,
            ...res.body.error,
          }
          expect(details).toHaveProperty('database')
          expect(details).toHaveProperty('redis')
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

    it('/docs-json (GET) should expose shared contract schemas', () => {
      return request(app.getHttpServer())
        .get('/docs-json')
        .expect(200)
        .expect((response) => {
          const schemas = response.body.components.schemas
          expect(schemas).toHaveProperty('ErrorEnvelopeDto')
          expect(schemas).toHaveProperty('PaginatedTasksResponseDto')
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
          expect(res.text).toContain('process_cpu_user_seconds_total')
          expect(res.headers).not.toHaveProperty('x-ratelimit-limit')
        })
    })
  })

  describe('Tasks API', () => {
    let createdTaskId: string

    it('/api/v1/tasks (GET) should return paginated tasks', async () => {
      const response = await request(app.getHttpServer())
        .get(`${apiPrefix}/tasks`)
        .expect(200)

      const data = dataOf<PaginatedTaskResponse>(response.body)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.meta).toMatchObject({
        page: 1,
        pageSize: 20,
      })
      expect(typeof data.meta.total).toBe('number')
    })

    it('/api/v1/tasks (POST) should create a task', async () => {
      const createTaskDto = {
        title: 'Test Task',
        description: 'This is a test task',
        priority: 5,
      }

      const response = await request(app.getHttpServer())
        .post(`${apiPrefix}/tasks`)
        .send(createTaskDto)
        .expect(201)

      const data = dataOf<TaskResponse>(response.body)

      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('title', createTaskDto.title)
      expect(data).toHaveProperty('description', createTaskDto.description)
      expect(data).toHaveProperty('priority', createTaskDto.priority)
      expect(data).toHaveProperty('status', 'PENDING')

      createdTaskId = data.id
    })

    it('/api/v1/tasks (POST) should validate input - missing title', async () => {
      const response = await request(app.getHttpServer())
        .post(`${apiPrefix}/tasks`)
        .send({
          description: 'Task without title',
        })
        .expect(422)

      expect(response.body).toHaveProperty('message')
      expect(response.body).toHaveProperty('errors')
      expect(response.body).toMatchObject({
        success: false,
        statusCode: 422,
        method: 'POST',
      })
      expect(response.body.path).toContain(`${apiPrefix}/tasks`)
      expect(response.body.meta).toHaveProperty('requestId')
    })

    it('/api/v1/tasks (POST) should validate input - invalid priority', async () => {
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

    it('/api/v1/tasks (POST) should validate input - invalid status', async () => {
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

    it('/api/v1/tasks/:id (GET) should return a task', async () => {
      const response = await request(app.getHttpServer())
        .get(`${apiPrefix}/tasks/${createdTaskId}`)
        .expect(200)

      const data = dataOf<TaskResponse>(response.body)

      expect(data).toHaveProperty('id', createdTaskId)
      expect(data).toHaveProperty('title', 'Test Task')
    })

    it('/api/v1/tasks/:id (GET) should return 404 for non-existent task', async () => {
      const response = await request(app.getHttpServer())
        .get(`${apiPrefix}/tasks/non_existent_id`)
        .expect(404)

      expect(response.body).toHaveProperty('message')
      expect(response.body).toHaveProperty('statusCode', 404)
      expect(response.body).toMatchObject({
        success: false,
        method: 'GET',
      })
      expect(response.body.path).toContain(`${apiPrefix}/tasks/non_existent_id`)
      expect(response.body.meta).toHaveProperty('requestId')
    })

    it('/api/v1/tasks/:id (PATCH) should update a task', async () => {
      const updateTaskDto = {
        title: 'Updated Task Title',
        status: 'IN_PROGRESS',
      }

      const response = await request(app.getHttpServer())
        .patch(`${apiPrefix}/tasks/${createdTaskId}`)
        .send(updateTaskDto)
        .expect(200)

      const data = dataOf<TaskResponse>(response.body)

      expect(data).toHaveProperty('id', createdTaskId)
      expect(data).toHaveProperty('title', updateTaskDto.title)
      expect(data).toHaveProperty('status', updateTaskDto.status)
    })

    it('/api/v1/tasks/:id (PATCH) should return 404 for non-existent task', async () => {
      const response = await request(app.getHttpServer())
        .patch(`${apiPrefix}/tasks/non_existent_id`)
        .send({ title: 'New Title' })
        .expect(404)

      expect(response.body).toHaveProperty('statusCode', 404)
    })

    it('/api/v1/tasks?status=IN_PROGRESS (GET) should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get(`${apiPrefix}/tasks?status=IN_PROGRESS`)
        .expect(200)

      const data = dataOf<PaginatedTaskResponse>(response.body)

      expect(Array.isArray(data.data)).toBe(true)
      for (const task of data.data) {
        expect(task.status).toBe('IN_PROGRESS')
      }
    })

    it('/api/v1/tasks?priority=5 (GET) should filter by priority', async () => {
      const response = await request(app.getHttpServer())
        .get(`${apiPrefix}/tasks?priority=5`)
        .expect(200)

      const data = dataOf<PaginatedTaskResponse>(response.body)

      expect(Array.isArray(data.data)).toBe(true)
      for (const task of data.data) {
        expect(task.priority).toBeGreaterThanOrEqual(5)
      }
    })

    it('/api/v1/tasks/:id (DELETE) should delete a task', async () => {
      await request(app.getHttpServer())
        .delete(`${apiPrefix}/tasks/${createdTaskId}`)
        .expect(204)
        .expect((response) => {
          expect(response.text).toBe('')
        })
    })

    it('/api/v1/tasks/:id (GET) should return 404 after deletion', async () => {
      const response = await request(app.getHttpServer())
        .get(`${apiPrefix}/tasks/${createdTaskId}`)
        .expect(404)

      expect(response.body).toHaveProperty('statusCode', 404)
    })

    it('/api/v1/tasks/:id (DELETE) should return 404 for non-existent task', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${apiPrefix}/tasks/non_existent_id`)
        .expect(404)

      expect(response.body).toHaveProperty('statusCode', 404)
    })
  })
})
