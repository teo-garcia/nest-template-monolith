import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'

import { AppController } from './app.controller'
import { PrismaService } from './shared/prisma'

describe('AppController', () => {
  let appController: AppController

  beforeEach(async () => {
    const mockPrismaService = {
      healthCheck: jest.fn().mockResolvedValue(true),
      user: { count: jest.fn().mockResolvedValue(0) },
      book: { count: jest.fn().mockResolvedValue(0) },
      getDatabaseInfo: jest
        .fn()
        .mockResolvedValue([{ database_name: 'test', current_user: 'test' }]),
    }

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test'),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    appController = app.get<AppController>(AppController)
  })

  describe('root', () => {
    it('should return welcome message', () => {
      expect(appController.getHello()).toBe(
        'NestJS Monolith Template - API is running! 🚀'
      )
    })
  })
})
