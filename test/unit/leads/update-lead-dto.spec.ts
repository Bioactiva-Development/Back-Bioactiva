import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { HttpUpdateLeadDto } from '@/modules/leads/infrastructure/http/dto/update-lead.dto.http';

describe('Leads module', () => {
    describe('HttpUpdateLeadDto', () => {
        it('accepts an empty payload because every field is optional', async () => {
            const dto = plainToInstance(HttpUpdateLeadDto, {});

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('accepts the editable fields', async () => {
            const dto = plainToInstance(HttpUpdateLeadDto, {
                servicioInteres: 'Consultoría',
                comentarios: 'Comentario',
                desafioOportunidad: 'Desafío',
                canalCaptacion: 'Web',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });
});
