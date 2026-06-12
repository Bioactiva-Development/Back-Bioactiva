import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { HttpLoggingInterceptor } from '@/shared/interceptors/http-logging.interceptor';

describe('Shared module', () => {
    describe('HttpLoggingInterceptor', () => {
        let interceptor: HttpLoggingInterceptor;
        let mockRequest: any;
        let mockResponse: any;
        let mockContext: any;

        beforeEach(() => {
            jest.spyOn(Logger.prototype, 'log').mockImplementation(
                () => undefined,
            );
            jest.spyOn(Logger.prototype, 'debug').mockImplementation(
                () => undefined,
            );
            jest.spyOn(Logger.prototype, 'error').mockImplementation(
                () => undefined,
            );

            mockRequest = {
                method: 'GET',
                originalUrl: '/api/test',
            };
            mockResponse = {
                statusCode: 200,
            };
            mockContext = {
                switchToHttp: () => ({
                    getRequest: () => mockRequest,
                    getResponse: () => mockResponse,
                }),
            };

            interceptor = new HttpLoggingInterceptor();
        });

        it('should log incoming request on debug', (done) => {
            const mockNext = { handle: () => of('response') };

            interceptor.intercept(mockContext, mockNext).subscribe({
                complete: () => {
                    expect(Logger.prototype.debug).toHaveBeenCalledWith(
                        'Incoming request GET /api/test',
                    );
                    done();
                },
            });
        });

        it('should log successful response', (done) => {
            const mockNext = { handle: () => of('response') };

            interceptor.intercept(mockContext, mockNext).subscribe({
                complete: () => {
                    expect(Logger.prototype.log).toHaveBeenCalledWith(
                        expect.stringContaining('GET /api/test -> 200'),
                    );
                    done();
                },
            });
        });

        it('should log failed request on error', (done) => {
            const error = new Error('Something went wrong');
            const mockNext = { handle: () => throwError(() => error) };

            interceptor.intercept(mockContext, mockNext).subscribe({
                error: () => {
                    expect(Logger.prototype.error).toHaveBeenCalledWith(
                        expect.stringContaining('GET /api/test failed after'),
                    );
                    done();
                },
            });
        });

        it('should rethrow the original error', (done) => {
            const error = new Error('Original error');
            const mockNext = { handle: () => throwError(() => error) };

            interceptor.intercept(mockContext, mockNext).subscribe({
                error: (err) => {
                    expect(err).toBe(error);
                    done();
                },
            });
        });

        it('should handle non-Error thrown values', (done) => {
            const mockNext = { handle: () => throwError(() => 'string error') };

            interceptor.intercept(mockContext, mockNext).subscribe({
                error: () => {
                    expect(Logger.prototype.error).toHaveBeenCalledWith(
                        expect.stringContaining('failed after'),
                    );
                    done();
                },
            });
        });
    });
});
