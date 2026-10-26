import { Injectable, OnApplicationShutdown } from '@nestjs/common'

import { shutdownTelemetry } from './telemetry.js'

@Injectable()
export class TelemetryShutdownService implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    await shutdownTelemetry()
  }
}
