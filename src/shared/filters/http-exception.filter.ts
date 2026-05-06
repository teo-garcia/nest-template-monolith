import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'

import { Prisma } from '../../generated/prisma/client'

type PrismaClientKnownRequestError = Prisma.PrismaClientKnownRequestError
import { Request, Response } from 'express'

interface ErrorResponse {
  success: false
  statusCode: number
  timestamp: string
  path: string
  method: string
  message: string | string[]
  error?: string
  errors?: Record<string, string[]>
  meta?: {
    requestId?: string
  }
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp()
    const response = context.getResponse<Response>()
    const request = context.getRequest<Request>()

    const errorResponse = this.buildErrorResponse(exception, request)

    this.logError(exception, request, errorResponse)

    response.status(errorResponse.statusCode).json(errorResponse)
  }

  private buildErrorResponse(
    exception: unknown,
    request: Request
  ): ErrorResponse {
    const timestamp = new Date().toISOString()
    const path = request.url
    const method = request.method
    const requestId =
      typeof (request as { id?: unknown }).id === 'string'
        ? (request as { id?: string }).id
        : undefined
    const meta = requestId ? { requestId } : undefined

    // Handle HTTP exceptions (including validation errors)
    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse != undefined
      ) {
        const responseObject = exceptionResponse as Record<string, unknown>

        return {
          success: false,
          statusCode: status,
          timestamp,
          path,
          method,
          message: responseObject.message as string | string[],
          error: responseObject.error as string,
          errors: responseObject.errors as Record<string, string[]>,
          meta,
        }
      }

      return {
        success: false,
        statusCode: status,
        timestamp,
        path,
        method,
        message:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : 'An error occurred',
        error: exception.name,
        meta,
      }
    }

    // Handle Prisma database errors
    if (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      'clientVersion' in exception
    ) {
      return this.handlePrismaError(
        exception as PrismaClientKnownRequestError,
        timestamp,
        path,
        method,
        meta
      )
    }

    // Handle unknown errors
    return {
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp,
      path,
      method,
      message: 'Internal server error',
      error: 'InternalServerError',
      meta,
    }
  }

  private handlePrismaError(
    exception: PrismaClientKnownRequestError,
    timestamp: string,
    path: string,
    method: string,
    meta?: ErrorResponse['meta']
  ): ErrorResponse {
    switch (exception.code) {
      case 'P2002': {
        // Unique constraint violation
        return {
          success: false,
          statusCode: HttpStatus.CONFLICT,
          timestamp,
          path,
          method,
          message: 'A record with this value already exists',
          error: 'ConflictError',
          meta,
        }
      }

      case 'P2025': {
        // Record not found
        return {
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          timestamp,
          path,
          method,
          message: 'Record not found',
          error: 'NotFoundError',
          meta,
        }
      }

      case 'P2003': {
        // Foreign key constraint violation
        return {
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp,
          path,
          method,
          message: 'Invalid reference to related record',
          error: 'BadRequestError',
          meta,
        }
      }

      default: {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          timestamp,
          path,
          method,
          message: 'Database error occurred',
          error: 'DatabaseError',
          meta,
        }
      }
    }
  }

  private logError(
    exception: unknown,
    request: Request,
    errorResponse: ErrorResponse
  ): void {
    const { statusCode, message, path, method } = errorResponse
    const userAgent = request.get('User-Agent') || ''
    const ip = request.ip || request.socket.remoteAddress

    if (statusCode >= 500) {
      this.logger.error(
        `${method} ${path} ${statusCode} - ${ip} ${userAgent}`,
        exception instanceof Error ? exception.stack : exception
      )
    } else if (statusCode >= 400) {
      this.logger.warn(
        `${method} ${path} ${statusCode} - ${ip} ${userAgent} - ${JSON.stringify(message)}`
      )
    }
  }
}
