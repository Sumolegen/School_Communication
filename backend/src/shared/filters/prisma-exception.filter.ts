import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.BAD_REQUEST;
    let message = 'Database request error';

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = 'A record with these unique details already exists.';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Referenced record does not exist or violates foreign key constraints.';
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Requested record was not found.';
        break;
      default:
        message = exception.message;
        break;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      error: exception.code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
