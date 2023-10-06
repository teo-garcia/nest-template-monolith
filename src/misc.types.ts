import type { HttpStatus } from '@nestjs/common';

export type StandardResponse<Resource = undefined> = {
  status: HttpStatus;
  message: string;
  data?: Resource;
};
