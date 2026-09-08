import { Logger as WinstonLogger } from 'winston'

import { AppLogger } from './logger.service'

describe('AppLogger', () => {
  it('writes structured metadata as top-level fields', () => {
    const logger = {
      info: jest.fn(),
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
})
