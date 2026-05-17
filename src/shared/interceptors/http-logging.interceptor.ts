import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, catchError, tap, throwError } from 'rxjs';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(HttpLoggingInterceptor.name);

    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<unknown> {
        const request = context.switchToHttp().getRequest<Request>();
        const { method, originalUrl } = request;
        const startedAt = Date.now();

        this.logger.debug(`Incoming request ${method} ${originalUrl}`);

        return next.handle().pipe(
            tap(() => {
                const response = context.switchToHttp().getResponse<Response>();
                const duration = Date.now() - startedAt;

                this.logger.log(
                    `${method} ${originalUrl} -> ${response.statusCode} (${duration}ms)`,
                );
            }),
            catchError((error: unknown) => {
                const duration = Date.now() - startedAt;
                const message =
                    error instanceof Error ? error.message : 'Unknown error';

                this.logger.error(
                    `${method} ${originalUrl} failed after ${duration}ms: ${message}`,
                );

                return throwError(() => error);
            }),
        );
    }
}
