import { bootstrapApplication } from './bootstrap'

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

void bootstrapApplication(async () => {
  const { startApplication } = await import('./application.js')
  await startApplication()
}).catch((error: unknown) => {
  console.error('Failed to start application:', error)
  process.exitCode = 1
})
