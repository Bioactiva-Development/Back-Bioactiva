import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { CreateCotizacionUseCase } from '@/modules/quotations/application/use-cases/create-cotizacion.use-case';
import { CreateCotizacionDto } from '@/modules/quotations/application/dto/create-cotizacion.dto';
import { EstadoCot } from '@/modules/quotations/domain/enums/estado-cot';
import { LeadNotFoundException } from '@/modules/leads/domain/exceptions/lead-not-found.exception';
import { UserNotFoundException } from '@/modules/users/domain/exceptions/user-not-found.exception';

describe('Quotations module', () => {
    describe('CreateCotizacionUseCase', () => {
        let useCase: CreateCotizacionUseCase;
        let cotizacionRepository: any;
        let leadRepository: any;
        let userRepository: any;

        const dto = new CreateCotizacionDto(
            new Date('2026-06-01T00:00:00.000Z'),
            'Dr. Martinez',
            'TechCorp',
            null,
            'Desarrollo',
            '5000.00',
            'USD',
            null,
            null,
            10,
            7,
            3,
        );

        beforeEach(() => {
            cotizacionRepository = { saveWithRelations: jest.fn() };
            leadRepository = { findById: jest.fn() };
            userRepository = { findById: jest.fn() };
            useCase = new CreateCotizacionUseCase(
                cotizacionRepository,
                leadRepository,
                userRepository,
            );
        });

        it('throws when the lead does not exist', async () => {
            leadRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
                LeadNotFoundException,
            );
        });

        it('throws when the remitente does not exist', async () => {
            leadRepository.findById.mockResolvedValue({ id: 10 });
            userRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
                UserNotFoundException,
            );
        });

        it('creates a PENDIENTE cotizacion with the remitente full name', async () => {
            leadRepository.findById.mockResolvedValue({ id: 10 });
            userRepository.findById.mockResolvedValue({
                nombres: 'Carlos',
                apellidos: 'López',
            });
            cotizacionRepository.saveWithRelations.mockImplementation(
                async (c: any) => ({ cotizacion: c }),
            );

            await useCase.execute(dto);

            const created =
                cotizacionRepository.saveWithRelations.mock.calls[0][0];
            expect(created.estado).toBe(EstadoCot.PENDIENTE);
            expect(created.nombre_remitente).toBe('Carlos López');
            expect(created.id_lead).toBe(10);
            expect(created.id_remitente).toBe(7);
            expect(created.id_author).toBe(3);
        });
    });
});
