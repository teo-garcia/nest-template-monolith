# Testing Strategy

## Testing Approach

This template follows a comprehensive testing approach with multiple levels of
tests:

1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test interactions between components
3. **End-to-End Tests**: Test the entire application flow

## Test Setup

### Testing Tools

- **Jest**: Testing framework
- **Supertest**: HTTP testing library
- **@nestjs/testing**: NestJS testing utilities

### Test Files Organization

```
project/
├── src/
│   └── module/
│       ├── service.ts
│       └── service.spec.ts         # Unit tests alongside source files
├── test/
│   ├── e2e/                        # End-to-end tests
│   │   └── app.e2e-spec.ts
│   └── integration/                # Integration tests
│       └── modules.integration.spec.ts
```

## Unit Testing

Unit tests focus on testing individual components in isolation, using mocks for
dependencies.

### Example: Testing a Service

```typescript
// users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { UsersService } from './users.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { User } from './entities/user.entity'

describe('UsersService', () => {
  let service: UsersService
  let mockRepository

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      // other repository methods
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result = [{ id: 1, username: 'test' }]
      mockRepository.find.mockResolvedValue(result)

      expect(await service.findAll()).toBe(result)
      expect(mockRepository.find).toHaveBeenCalled()
    })
  })
})
```

## Integration Testing

Integration tests focus on testing the interaction between different modules and
components.

### Example: Testing Module Integration

```typescript
// auth.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'
import { getConnection } from 'typeorm'

describe('Authentication (Integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('AuthModule', () => {
    it('should register a new user', async () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id')
          expect(res.body.username).toBe('testuser')
        })
    })

    it('should authenticate a user', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token')
        })
    })
  })
})
```

## End-to-End Testing

End-to-end tests validate the entire application flow from start to finish.

### Example: E2E Test

```typescript
// app.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from './../src/app.module'

describe('AppController (e2e)', () => {
  let app: INestApplication
  let authToken: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    // Get authentication token for protected routes
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'testuser',
        password: 'password123',
      })

    authToken = response.body.access_token
  })

  afterAll(async () => {
    await app.close()
  })

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!')
  })

  it('/users (GET) - protected route', () => {
    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true)
      })
  })
})
```

## Test Database

For integration and E2E tests that require a database:

1. Use an in-memory database like SQLite for tests
2. Set up a test database with migrations
3. Clear database between test runs

Example test database configuration:

```typescript
// test database configuration
{
  type: 'sqlite',
  database: ':memory:',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
}
```

## Mocking

Guidelines for effective mocking:

1. Mock external dependencies
2. Use Jest's mocking capabilities
3. Create reusable mock factories

Example mock factory:

```typescript
// user.mock.ts
export const createMockUser = (override = {}) => ({
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashedpassword',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...override,
})
```

## Test Coverage

The template is configured to generate test coverage reports:

```bash
npm run test:cov
```

Aim for:

- 85%+ coverage for services and business logic
- 70%+ coverage for controllers
- 90%+ coverage for critical path functionality

## Test Automation

Tests are automatically run:

1. During pre-commit hooks (basic tests)
2. On pull requests (full test suite)
3. During CI/CD pipeline (full test suite with coverage)

## Best Practices

1. Write tests before code (TDD) when possible
2. Keep tests small and focused
3. Use descriptive test names
4. Don't test implementation details
5. Avoid test interdependencies
6. Use test fixtures and factories
7. Mock external dependencies
