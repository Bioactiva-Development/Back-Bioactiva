import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { GlobalExceptionFilter } from '@/shared/infrastructure/filters/global-exception.filter';
import { DomainException } from '@/shared/domain/exceptions/domain.exception';
import { DomainErrorKind } from '@/shared/domain/exceptions/domain-error-kind';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

describe('Shared module', () => {
    describe('GlobalExceptionFilter', () => {
        let filter: GlobalExceptionFilter;
        let mockResponse: any;
        let mockRequest: any;
        let mockHost: any;

        beforeEach(() => {
            jest.spyOn(Logger.prototype, 'error').mockImplementation(
                () => undefined,
            );
            jest.spyOn(Logger.prototype, 'log').mockImplementation(
                () => undefined,
            );

            mockResponse = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            mockRequest = {
                originalUrl: '/test',
                method: 'GET',
            };
            mockHost = {
                switchToHttp: () => ({
                    getResponse: () => mockResponse,
                    getRequest: () => mockRequest,
                }),
            };
            filter = new GlobalExceptionFilter();
        });

        it('should handle DomainException with NotFound kind', () => {
            class TestNotFoundEx extends DomainException {
                readonly kind = DomainErrorKind.NotFound;
            }
            const exception = new TestNotFoundEx('Resource not found');

            filter.catch(exception, mockHost);

            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.NOT_FOUND,
            );
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 404,
                    kind: DomainErrorKind.NotFound,
                }),
            );
        });

        it('should handle DomainException with Validation kind', () => {
            class TestValidationEx extends DomainException {
                readonly kind = DomainErrorKind.Validation;
            }
            const exception = new TestValidationEx('Invalid data');

            filter.catch(exception, mockHost);

            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.BAD_REQUEST,
            );
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    kind: DomainErrorKind.Validation,
                }),
            );
        });

        it('should handle HttpException', () => {
            const exception = new HttpException(
                'Forbidden',
                HttpStatus.FORBIDDEN,
            );

            filter.catch(exception, mockHost);

            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.FORBIDDEN,
            );
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 403,
                    kind: DomainErrorKind.Forbidden,
                }),
            );
        });

        it('should handle HttpException with object response', () => {
            const exception = new HttpException(
                { message: ['field1 is required'] },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );

            filter.catch(exception, mockHost);

            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    kind: DomainErrorKind.Validation,
                }),
            );
        });

        it('should handle unknown errors as InternalServerError', () => {
            const exception = new Error('Something broke');

            filter.catch(exception, mockHost);

            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 500,
                    kind: DomainErrorKind.Unexpected,
                    message: 'Something broke',
                }),
            );
        });

        it('should handle non-Error unknown exceptions', () => {
            const exception = 'string error';

            filter.catch(exception, mockHost);

            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Internal server error',
                }),
            );
        });

        it('should include path and timestamp in response', () => {
            const exception = new Error('test');

            filter.catch(exception, mockHost);

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    path: '/test',
                    timestamp: expect.any(String),
                }),
            );
        });

        it('should handle Prisma unique constraint violation (P2002)', () => {
            const exception = new PrismaClientKnownRequestError(
                'Unique constraint failed',
                {
                    code: 'P2002',
                    clientVersion: '5.0.0',
                },
            );

            filter.catch(exception, mockHost);

            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.CONFLICT,
            );
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 409,
                    error: 'UniqueConstraintViolation',
                    kind: DomainErrorKind.Conflict,
                }),
            );
        });

        it('should handle Prisma record not found (P2025)', () => {
            const exception = new PrismaClientKnownRequestError(
                'Record not found',
                {
                    code: 'P2025',
                    clientVersion: '5.0.0',
                },
            );

            filter.catch(exception, mockHost);

            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.NOT_FOUND,
            );
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 404,
                    error: 'RecordNotFound',
                }),
            );
        });

        it('should handle unknown Prisma error codes as InternalServerError', () => {
            const exception = new PrismaClientKnownRequestError(
                'Unknown error',
                {
                    code: 'P9999',
                    clientVersion: '5.0.0',
                },
            );

            filter.catch(exception, mockHost);

            expect(mockResponse.status).toHaveBeenCalledWith(
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 500,
                    error: 'DatabaseError',
                    kind: DomainErrorKind.Unexpected,
                }),
            );
        });
    });
});
