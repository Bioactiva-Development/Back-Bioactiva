import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DOMAIN_ERROR_MAP } from './domain-error-map';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
    catch(exception: Error, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        const exceptionName = exception.constructor.name;
        const status = DOMAIN_ERROR_MAP[exceptionName];

        if (status) {
            return response.status(status).json({
                statusCode: status,
                message: exception.message,
                error: exceptionName,
            });
        }

        // Si es una excepción de NestJS (HttpException), conservamos su código y estructura
        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const res = exception.getResponse();
            return response.status(status).json(
                typeof res === 'string'
                    ? { statusCode: status, message: res }
                    : res
            );
        }

        // Error genérico del servidor (500)
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: exception.message || 'Internal server error',
            error: 'InternalServerError',
        });
    }
}
