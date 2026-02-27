import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  DomainError,
  EntityNotFoundError,
  OwnershipViolationError,
  InvalidOperationError,
  DuplicateError,
  InvalidCredentialsError,
  AccountDisabledError,
} from '../../../domain/common/domain-error.base';

/**
 * Exception filter that catches DomainError subclasses and maps them
 * to appropriate HTTP status codes.
 *
 * Non-DomainError exceptions pass through to the default NestJS handler.
 *
 * Response format matches existing envelope:
 * { statusCode, message, timestamp, path }
 */
@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.mapToHttpStatus(exception);

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} — [${exception.code}] ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} — [${exception.code}] ${exception.message}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private mapToHttpStatus(error: DomainError): HttpStatus {
    if (error instanceof EntityNotFoundError) {
      return HttpStatus.NOT_FOUND; // 404
    }
    if (error instanceof OwnershipViolationError) {
      return HttpStatus.FORBIDDEN; // 403
    }
    if (error instanceof DuplicateError) {
      return HttpStatus.CONFLICT; // 409
    }
    if (error instanceof InvalidCredentialsError) {
      return HttpStatus.UNAUTHORIZED; // 401
    }
    if (error instanceof AccountDisabledError) {
      return HttpStatus.FORBIDDEN; // 403
    }
    if (error instanceof InvalidOperationError) {
      return HttpStatus.BAD_REQUEST; // 400
    }
    // Any other DomainError subclass
    return HttpStatus.BAD_REQUEST; // 400
  }
}
