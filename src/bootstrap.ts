import { config } from 'dotenv'

export async function bootstrapApplication(
  startApplication: () => Promise<void>
): Promise<void> {
  config({ quiet: true })
  const { startTelemetry } = await import('./telemetry.js')
  await startTelemetry()
  await startApplication()
}
