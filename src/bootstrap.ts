import { startTelemetry } from './telemetry'

export async function bootstrapApplication(
  startApplication: () => Promise<void>
): Promise<void> {
  await startTelemetry()
  await startApplication()
}
