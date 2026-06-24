import { applyDecorators } from '@nestjs/common';
import { Matches, MaxLength, MinLength } from 'class-validator';

/**
 * Mensaje único exigido por el requisito de seguridad de contraseñas: se usa
 * tanto para la longitud mínima como para la complejidad, de modo que el
 * usuario siempre reciba la misma indicación completa.
 */
export const STRONG_PASSWORD_MESSAGE =
    'La contraseña debe tener al menos 8 caracteres e incluir una letra mayúscula, una letra minúscula, un número y un carácter especial.';

/**
 * Exige una contraseña de al menos 8 caracteres con al menos una mayúscula,
 * una minúscula, un número y un carácter especial. El máximo de 72 evita
 * superar el límite de bytes de bcrypt. Reutilizable en registro/activación,
 * actualización y reset de contraseña.
 */
export function IsStrongPassword() {
    return applyDecorators(
        MinLength(8, { message: STRONG_PASSWORD_MESSAGE }),
        MaxLength(72, {
            message: 'La contraseña no debe superar los 72 caracteres.',
        }),
        Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
            message: STRONG_PASSWORD_MESSAGE,
        }),
    );
}
