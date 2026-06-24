import { describe, expect, it } from '@jest/globals';
import {
    TIPO_EMPRESA_LABEL,
    TAMANO_LABEL,
    SECTOR_LABEL,
    VOCATIVO_LABEL,
    ESTADO_CORREO_LABEL,
    LEAD_STATE_LABEL,
    TIPO_ACTIVIDAD_LABEL,
    ESTADO_ACTIVIDAD_LABEL,
    TIPO_MONEDA_LABEL,
    ESTADO_COT_LABEL,
    labelOf,
} from '@/modules/data-management/domain/constants/enum-labels';

describe('Data management module', () => {
    describe('enum-labels', () => {
        it('exposes the canonical labels for each enum', () => {
            expect(TIPO_EMPRESA_LABEL.EMPRESA_NACIONAL).toBe(
                'Empresa nacional',
            );
            expect(TAMANO_LABEL.PEQUENO).toBe('Pequeña');
            expect(SECTOR_LABEL.AGRICOLA).toBe('Agrícola');
            expect(VOCATIVO_LABEL.SR).toBe('Sr.');
            expect(ESTADO_CORREO_LABEL.VENCIDO).toBe('Vencido');
            // Lead states usan la versión legible del nombre interno.
            expect(LEAD_STATE_LABEL.EN_PROSPECTO).toBe('En prospecto');
            expect(TIPO_ACTIVIDAD_LABEL.REUNION).toBe('Reunión');
            expect(ESTADO_ACTIVIDAD_LABEL.PENDIENTE).toBe('Pendiente');
            expect(TIPO_MONEDA_LABEL.USD).toBe('USD');
            expect(ESTADO_COT_LABEL.ACEPTADA).toBe('Aceptada');
        });

        describe('labelOf', () => {
            it('returns the mapped label for a known value', () => {
                expect(labelOf(TIPO_EMPRESA_LABEL, 'ACADEMIA')).toBe(
                    'Academia',
                );
            });

            it('returns the raw value when it is not in the map', () => {
                expect(labelOf(TIPO_EMPRESA_LABEL, 'DESCONOCIDO')).toBe(
                    'DESCONOCIDO',
                );
            });

            it('returns an empty string for null', () => {
                expect(labelOf(TIPO_EMPRESA_LABEL, null)).toBe('');
            });

            it('returns an empty string for undefined', () => {
                expect(labelOf(TIPO_EMPRESA_LABEL, undefined)).toBe('');
            });
        });
    });
});
