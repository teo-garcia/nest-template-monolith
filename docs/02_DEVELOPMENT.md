# Development Workflow & Guidelines

## 🚀 Development Roadmap & Progress

### **Phase 1: Core Infrastructure**

- [x] **1. Prisma Service Integration** 🗄️ - _COMPLETED_
  - ✅ Created shared Prisma service for database operations
  - ✅ Set up database connection and error handling
  - ✅ Added Prisma service to global modules
  - ✅ Enhanced health check endpoints with database status
  - ✅ Added database info endpoint for debugging
- [x] **2. Global Validation & Error Handling** 🛡️ - _COMPLETED_
  - ✅ Created global validation pipe with detailed error messages
  - ✅ Implemented global exception filter for consistent error responses
  - ✅ Added response transformation interceptor for standardized API responses
  - ✅ Integrated Prisma error handling for database-specific errors
  - ✅ Added comprehensive logging for errors and requests
- [ ] **3. Swagger API Documentation** 📚
  - Configure Swagger in main.ts
  - Create API response decorators
  - Set up automatic documentation generation

### **Phase 2: Authentication System**

- [ ] **4. Authentication Module** 🔐
  - JWT strategy implementation
  - Login/Register endpoints
  - Auth guards and decorators
- [ ] **5. User Management Module** 👥
  - User CRUD operations
  - User profile management
  - Role-based access control

### **Phase 3: Core Features**

- [ ] **6. Books Management Module** 📖
  - Book CRUD operations
  - Search and filtering
  - User-book relationships
- [ ] **7. Security & Middleware** 🔒
  - Rate limiting
  - CORS configuration
  - Security headers

### **Phase 4: Advanced Features**

- [ ] **8. Caching Layer** ⚡
  - Redis integration
  - Cache strategies
  - Performance optimization
- [ ] **9. File Upload** 📁
  - Image upload for books
  - File validation
  - Storage management
- [ ] **10. Testing Suite** 🧪
  - Unit tests for all modules
  - Integration tests
  - E2E test scenarios

---

## 📋 What's Implemented

### **Prisma Service (Step 1)**

The Prisma service provides a robust database connection layer with the
following features:

**Files Created:**

- `src/shared/prisma/prisma.service.ts` - Main database service
- `src/shared/prisma/prisma.module.ts` - Global module configuration
- `src/shared/prisma/index.ts` - Export barrel

**Features:**

- **Database Connection Management**: Automatic connection/disconnection
- **Error Handling**: Comprehensive error logging and handling
- **Health Checks**: Database connectivity verification
- **Development Logging**: Query logging in development mode
- **Raw SQL Support**: Safe raw SQL execution methods
- **Global Availability**: Available throughout the application

**New Endpoints:**

- `GET /api/health` - Enhanced with database status
- `GET /api/health/database` - Detailed database health and info

### **Global Validation & Error Handling (Step 2)**

Comprehensive validation and error handling system with consistent API
responses:

**Files Created:**

- `src/shared/pipes/validation.pipe.ts` - Global validation pipe
- `src/shared/filters/http-exception.filter.ts` - Global exception filter
- `src/shared/interceptors/transform.interceptor.ts` - Response transformation
- `src/shared/pipes/index.ts` - Pipes export barrel
- `src/shared/filters/index.ts` - Filters export barrel
- `src/shared/interceptors/index.ts` - Interceptors export barrel
- `src/app.dto.ts` - Test validation DTO

**Features:**

**Validation Pipe:**

- Automatic DTO validation using class-validator
- Detailed validation error messages
- Property whitelisting and transformation
- Nested object validation support

**Exception Filter:**

- Consistent error response format
- Prisma database error handling
- Comprehensive error logging
- HTTP status code mapping

**Transform Interceptor:**

- Standardized API response structure
- Request metadata (duration, requestId, version)
- Development request logging
- Success response wrapping

**Error Response Format:**

```json
{
  "statusCode": 400,
  "timestamp": "2025-06-02T17:56:39.521Z",
  "path": "/api/test/validation",
  "method": "POST",
  "message": "Validation failed",
  "errors": {
    "field": ["Field validation error messages"]
  }
}
```

**Success Response Format:**

```json
{
  "success": true,
  "statusCode": 200,
  "timestamp": "2025-06-02T17:55:55.306Z",
  "path": "/api/endpoint",
  "method": "GET",
  "data": {
    /* actual response data */
  },
  "meta": {
    "requestId": "req_1748886955306_3p6qnochu",
    "version": "1.0",
    "duration": 1
  }
}
```

**Test Endpoints:**

- `POST /api/test/validation` - Test validation with DTO
- `GET /api/test/error/:type` - Test different error types
- `GET /api/test/transform` - Test response transformation

**Usage Example:**

```typescript
// Create a DTO with validation
export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsEmail()
  email: string;
}

// Use in controller - validation happens automatically
@Post('users')
createUser(@Body() dto: CreateUserDto) {
  return this.userService.create(dto);
}
```

---

## Setting Up Development Environment

### Prerequisites

- Node.js (v22+)
- pnpm (v9+)
- Git
- PostgreSQL (optional, can use Docker instead)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   pnpm start:dev
   ```

## Development Workflow

### Branching Strategy

We follow GitFlow branching model:

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `release/*`: Release preparation
- `hotfix/*`: Production hotfixes

### Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/)
specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types include:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting changes
- `refactor`: Code refactoring
- `test`: Adding/fixing tests
- `chore`: Maintenance tasks

### Pull Request Process

1. Create a feature/bugfix branch
2. Implement changes with tests
3. Ensure tests and linting pass
4. Create a PR against `develop`
5. Address review feedback
6. Merge after approval

## Code Style & Quality

### Linting & Formatting

The project is configured with ESLint and Prettier. Run the following commands:

- `pnpm run lint`: Check for code style issues
- `pnpm run format`: Format code with Prettier

### Pre-commit Hooks

Husky is configured to run the following checks before each commit:

- Linting
- Type checking
- Unit tests
- Formatting validation

### Testing

We follow a test-driven development approach:

- `pnpm run test`: Run unit tests
- `pnpm run test:e2e`: Run end-to-end tests
- `pnpm run test:cov`: Run tests with coverage report

Aim for high test coverage, particularly for business logic.

## Adding New Features

### Creating a New Module

1. Generate module structure:

   ```bash
   nest g module modules/your-module
   ```

2. Generate controller:

   ```bash
   nest g controller modules/your-module
   ```

3. Generate service:

   ```bash
   nest g service modules/your-module
   ```

4. Create DTO, entity, and repository classes
5. Add the module to the main AppModule

### Database Changes

For database changes:

1. Create or modify entity classes
2. Create migration:
   ```bash
   pnpm run migration:generate -- -n MigrationName
   ```
3. Run migrations:
   ```bash
   pnpm run migration:run
   ```

## Debugging

### Debugging in VS Code

Launch configurations for VS Code are provided in `.vscode/launch.json`:

1. JavaScript Debug Terminal:
   - Run `pnpm run start:debug`
   - Set breakpoints in VS Code

2. Attach to Process:
   - Use the "Attach" launch configuration
   - Connect to the running Node.js process

### Logging

Use the built-in Logger service for consistent logging:

```typescript
import { Logger } from '@nestjs/common';

private readonly logger = new Logger(YourService.name);

this.logger.log('This is a log message');
this.logger.error('This is an error', stack);
this.logger.warn('This is a warning');
this.logger.debug('This is a debug message');
this.logger.verbose('This is a verbose message');
```

## Performance Optimization

- Use async/await consistently
- Implement caching for expensive operations
- Optimize database queries with proper indexes
- Use environment-specific configurations

## Security Best Practices

- Validate all inputs using DTO validation
- Sanitize outputs to prevent XSS
- Implement proper authorization for all routes
- Use HTTPS in production
- Follow OWASP guidelines for security
