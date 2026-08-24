import { applyDecorators, Type } from '@nestjs/common'
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger'

import { SuccessEnvelopeDto } from './success-envelope.dto'

interface EnvelopeResponseOptions {
  /** HTTP status the payload is returned with. Defaults to 200. */
  status?: number
  description?: string
  /** Set when the endpoint returns an array of `type`. */
  isArray?: boolean
}

/**
 * Documents an endpoint's success response the way it is actually serialised:
 * the shared success envelope, with the payload nested under `data`.
 *
 * Without this, the spec describes the inner DTO while the wire format is the
 * envelope, so generated clients break on the first request.
 */
export const ApiEnvelopeResponse = <TModel extends Type<unknown>>(
  type: TModel,
  options: EnvelopeResponseOptions = {}
) => {
  const { status = 200, description, isArray = false } = options
  const dataSchema = isArray
    ? { type: 'array', items: { $ref: getSchemaPath(type) } }
    : { $ref: getSchemaPath(type) }

  return applyDecorators(
    ApiExtraModels(SuccessEnvelopeDto, type),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(SuccessEnvelopeDto) },
          {
            type: 'object',
            required: ['data'],
            properties: { data: dataSchema },
          },
        ],
      },
    })
  )
}
