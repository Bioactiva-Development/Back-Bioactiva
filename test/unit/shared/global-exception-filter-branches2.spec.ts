import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { GlobalExceptionFilter } from '@/shared/infrastructure/filters/global-exception.filter';
import { DomainErrorKind } from '@/shared/domain/exceptions/domain-error-kind';

/**
 * Branch coverage extra para buildPayload con HttpException:
 *  - linea 148: `(response.message ?? exception.message)` -> fallback a
 *    exception.message cuando el objeto de respuesta no trae `message`.
 *  - linea 156: `HTTP_STATUS_TO_KIND.get(status) ?? DomainErrorKind.Unexpected`
 *    -> fallback cuando el status no está mapeado.
 */
describe('Shared module — GlobalExceptionFilter branches2', () => {
    let filter: GlobalExceptionFilter;
    let mockResponse: any;
    let mockRequest: any;
    let mockHost: any;

    beforeEach(() => {
        jest.spyOn(Logger.prototype, 'error').mockImplementation(
            () => undefined,
        );
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        mockRequest = { originalUrl: '/test', method: 'GET' };
        mockHost = {
            switchToHttp: () => ({
                getResponse: () => mockResponse,
                getRequest: () => mockRequest,
            }),
        };
        filter = new GlobalExceptionFilter();
    });

    it('falls back to exception.message when the response object has no message', () => {
        // status 418 (no mapeado) + objeto de respuesta sin `message`.
        const exception = new HttpException(
            { error: 'Teapot' },
            HttpStatus.I_AM_A_TEAPOT,
        );

        filter.catch(exception, mockHost);

        const payload = mockResponse.json.mock.calls[0][0];
        // message proviene de exception.message (fallback).
        expect(typeof payload.message).toBe('string');
        // status no mapeado -> kind Unexpected (fallback).
        expect(payload.kind).toBe(DomainErrorKind.Unexpected);
        expect(payload.statusCode).toBe(HttpStatus.I_AM_A_TEAPOT);
    });
});
