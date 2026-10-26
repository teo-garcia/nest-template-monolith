import { Logger as WinstonLogger } from 'winston'

import { AppLogger } from './logger.service.js'

describe('AppLogger', () => {
  it('writes structured metadata as top-level fields', () => {
    const logger = {
      info: vi.fn(),
    } as unknown as WinstonLogger
    const appLogger = new AppLogger(logger)
    appLogger.setContext('Request')

    appLogger.log('request', { request_id: 'request-1' }, { status: 200 })

    expect(logger.info).toHaveBeenCalledWith('request', {
      context: 'Request',
      request_id: 'request-1',
      status: 200,
    })
  })

  it('uses Nest’s trailing context without spreading it into character fields', () => {
    const logger = { info: vi.fn() } as unknown as WinstonLogger
    const appLogger = new AppLogger(logger)
    appLogger.setContext('Bootstrap')

    appLogger.log('Module initialized', 'InstanceLoader')

    expect(logger.info).toHaveBeenCalledWith('Module initialized', {
      context: 'InstanceLoader',
    })
  })

  it('retains structured fields when Nest appends a context', () => {
    const logger = { warn: vi.fn() } as unknown as WinstonLogger
    const appLogger = new AppLogger(logger)

    appLogger.warn('request', { request_id: 'request-1' }, 'Controller')

    expect(logger.warn).toHaveBeenCalledWith('request', {
      context: 'Controller',
      request_id: 'request-1',
    })
  })

  it('keeps the error stack separate from Nest’s trailing context', () => {
    const logger = { error: vi.fn() } as unknown as WinstonLogger
    const appLogger = new AppLogger(logger)

    appLogger.error(
      'Failed',
      'stack trace',
      { request_id: 'request-1' },
      'ExceptionHandler'
    )

    expect(logger.error).toHaveBeenCalledWith('Failed', {
      context: 'ExceptionHandler',
      trace: 'stack trace',
      request_id: 'request-1',
    })
  })
})
