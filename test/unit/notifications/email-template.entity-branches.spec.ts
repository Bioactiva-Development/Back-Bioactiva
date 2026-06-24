import { describe, expect, it } from '@jest/globals';
import { EmailTemplate } from '@/modules/notifications/domain/entities/email-template';

describe('Notifications module', () => {
    describe('EmailTemplate entity — branches', () => {
        const build = () =>
            EmailTemplate.create({
                nombre: 'Plantilla',
                asunto: 'Asunto',
                cuerpo: 'Cuerpo',
            });

        it('create defaults activo to true when omitted', () => {
            expect(build().activo).toBe(true);
        });

        it('create honors activo when explicitly false', () => {
            const t = EmailTemplate.create({
                nombre: 'P',
                asunto: 'A',
                cuerpo: 'C',
                activo: false,
            });
            expect(t.activo).toBe(false);
        });

        it('update overwrites every provided field', () => {
            const t = build();
            t.update({
                nombre: 'Nuevo',
                asunto: 'Asunto nuevo',
                cuerpo: 'Cuerpo nuevo',
                activo: false,
            });
            expect(t.nombre).toBe('Nuevo');
            expect(t.asunto).toBe('Asunto nuevo');
            expect(t.cuerpo).toBe('Cuerpo nuevo');
            expect(t.activo).toBe(false);
        });

        it('update leaves untouched fields when they are undefined', () => {
            const t = build();
            t.update({ asunto: 'Solo asunto' });
            expect(t.nombre).toBe('Plantilla');
            expect(t.asunto).toBe('Solo asunto');
            expect(t.cuerpo).toBe('Cuerpo');
            expect(t.activo).toBe(true);
        });

        it('update with an empty object changes nothing but bumps updated_at', () => {
            const t = build();
            t.update({});
            expect(t.nombre).toBe('Plantilla');
            expect(t.asunto).toBe('Asunto');
            expect(t.cuerpo).toBe('Cuerpo');
            expect(t.activo).toBe(true);
        });
    });
});
