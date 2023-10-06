import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { StandardResponse } from 'src/misc.types';

@Controller('healthcheck')
export class HealthCheckController {
  constructor() {}

  @Get()
  @HttpCode(200)
  healthcheck(): StandardResponse {
    return {
      message: 'ok',
      status: HttpStatus['OK'],
    };
  }
}
