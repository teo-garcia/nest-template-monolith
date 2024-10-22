import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealthcheck() {
    return {
      message: 'OK',
      status: 200,
      error: null,
    };
  }
}
