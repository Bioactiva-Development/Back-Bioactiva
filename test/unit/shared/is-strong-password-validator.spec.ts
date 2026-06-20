import { describe, expect, it } from '@jest/globals';
import { validate } from 'class-validator';
import {
    IsStrongPassword,
    STRONG_PASSWORD_MESSAGE,
} from '@/shared/infrastructure/validators/is-strong-password.validator';

/**
 * IsStrongPassword
 * ----------------
 * Exige longitud >= 8 con mayúscula, minúscula, número y carácter especial.
 */
class PasswordDto {
    @IsStrongPassword()
    password!: string;
}

const buildDto = (password: string): PasswordDto => {
    const dto = new PasswordDto();
    dto.password = password;
    return dto;
};

describe('IsStrongPassword validator', () => {
    it('passes with a compliant password', async () => {
        const errors = await validate(buildDto('Segura123!'));
        expect(errors).toHaveLength(0);
    });

    it.each([
        ['too short', 'Ab1!def'],
        ['no uppercase', 'segura123!'],
        ['no lowercase', 'SEGURA123!'],
        ['no number', 'SeguraPass!'],
        ['no special char', 'Segura1234'],
    ])('fails when %s', async (_label, password) => {
        const errors = await validate(buildDto(password));
        expect(errors).toHaveLength(1);
        const messages = Object.values(errors[0].constraints ?? {});
        expect(messages).toContain(STRONG_PASSWORD_MESSAGE);
    });

    it('rejects passwords longer than 72 characters', async () => {
        const errors = await validate(buildDto('Aa1!'.repeat(20)));
        expect(errors).toHaveLength(1);
        expect(errors[0].constraints).toHaveProperty('maxLength');
    });
});
