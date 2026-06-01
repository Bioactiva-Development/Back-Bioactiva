import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { DomainException } from '@/shared/domain/exceptions/domain.exception';
import { DomainErrorKind } from '@/shared/domain/exceptions/domain-error-kind';

const KIND_TO_HTTP_STATUS: Record<DomainErrorKind, number> = {
    [DomainErrorKind.Validation]: HttpStatus.BAD_REQUEST,
    [DomainErrorKind.NotFound]: HttpStatus.NOT_FOUND,
    [DomainErrorKind.Conflict]: HttpStatus.CONFLICT,
    [DomainErrorKind.Unauthorized]: HttpStatus.UNAUTHORIZED,
    [DomainErrorKind.Forbidden]: HttpStatus.FORBIDDEN,
    [DomainErrorKind.Unexpected]: HttpStatus.INTERNAL_SERVER_ERROR,
};

const HTTP_STATUS_TO_KIND = new Map<number, DomainErrorKind>([
    [HttpStatus.BAD_REQUEST, DomainErrorKind.Validation],
    [HttpStatus.UNPROCESSABLE_ENTITY, DomainErrorKind.Validation],
    [HttpStatus.NOT_FOUND, DomainErrorKind.NotFound],
    [HttpStatus.CONFLICT, DomainErrorKind.Conflict],
    [HttpStatus.UNAUTHORIZED, DomainErrorKind.Unauthorized],
    [HttpStatus.FORBIDDEN, DomainErrorKind.Forbidden],
]);

interface ErrorPayload {
    statusCode: number;
    error: string;
    kind: DomainErrorKind;
    message: string | string[];
    path: string;
    timestamp: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const payload = this.buildPayload(exception, request);

        if (payload.statusCode >= 500) {
            this.logger.error(
                `${request.method} ${request.originalUrl} -> ${payload.statusCode}`,
                exception instanceof Error
                    ? exception.stack
                    : String(exception),
            );
        }

        response.status(payload.statusCode).json(payload);
    }

    private buildPrismaError(
        exception: PrismaClientKnownRequestError,
        base: { path: string; timestamp: string },
    ): ErrorPayload {
        const prismaCode = exception.code;

        const errorMap: Record<
            string,
            { status: number; kind: DomainErrorKind; label: string }
        > = {
            P2000: {
                status: HttpStatus.BAD_REQUEST,
                kind: DomainErrorKind.Validation,
                label: 'ValueTooLong',
            },
            P2002: {
                status: HttpStatus.CONFLICT,
                kind: DomainErrorKind.Conflict,
                label: 'UniqueConstraintViolation',
            },
            P2003: {
                status: HttpStatus.BAD_REQUEST,
                kind: DomainErrorKind.Validation,
                label: 'ForeignKeyViolation',
            },
            P2011: {
                status: HttpStatus.BAD_REQUEST,
                kind: DomainErrorKind.Validation,
                label: 'NullConstraintViolation',
            },
            P2014: {
                status: HttpStatus.BAD_REQUEST,
                kind: DomainErrorKind.Validation,
                label: 'RequiredRelationViolation',
            },
            P2025: {
                status: HttpStatus.NOT_FOUND,
                kind: DomainErrorKind.NotFound,
                label: 'RecordNotFound',
            },
        };

        const mapped = errorMap[prismaCode];
        if (mapped) {
            return {
                ...base,
                statusCode: mapped.status,
                error: mapped.label,
                kind: mapped.kind,
                message: exception.message,
            };
        }

        return {
            ...base,
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'DatabaseError',
            kind: DomainErrorKind.Unexpected,
            message: exception.message,
        };
    }

    private buildPayload(exception: unknown, request: Request): ErrorPayload {
        const base = {
            path: request.originalUrl,
            timestamp: new Date().toISOString(),
        };

        if (exception instanceof DomainException) {
            return {
                ...base,
                statusCode: KIND_TO_HTTP_STATUS[exception.kind],
                error: exception.name,
                kind: exception.kind,
                message: exception.message,
            };
        }

        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const response = exception.getResponse();
            const message =
                typeof response === 'string'
                    ? response
                    : ((response as { message?: string | string[] }).message ??
                      exception.message);

            return {
                ...base,
                statusCode: status,
                error: exception.name,
                kind:
                    HTTP_STATUS_TO_KIND.get(status) ??
                    DomainErrorKind.Unexpected,
                message,
            };
        }

        if (exception instanceof PrismaClientKnownRequestError) {
            return this.buildPrismaError(exception, base);
        }

        return {
            ...base,
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'InternalServerError',
            kind: DomainErrorKind.Unexpected,
            message:
                exception instanceof Error
                    ? exception.message
                    : 'Internal server error',
        };
    }
}
