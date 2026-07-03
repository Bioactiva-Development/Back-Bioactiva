import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { EncryptionServicePort } from '@/shared/domain/ports/encryption-service.port';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

/**
 * Clave de desarrollo insegura, usada solo si ENCRYPTION_KEY no está definida
 * (para no bloquear el arranque en dev/CI). `Buffer.alloc(32, fill)` repite el
 * string de relleno hasta completar exactamente 32 bytes. NUNCA usar en
 * producción — cualquiera con acceso al código puede descifrar con ella.
 */
const INSECURE_DEFAULT_KEY = Buffer.alloc(32, 'bioactiva-dev-insecure-key');

/**
 * Cifrado simétrico reversible (AES-256-GCM) para secretos que la app debe
 * poder leer de vuelta en texto plano (a diferencia de HashServicePort, que
 * es de una sola vía). Primer y único consumidor hoy: refreshToken de la
 * integración con Microsoft (IntegracionMicrosoft.refreshToken), que se
 * persiste en la base de datos y se necesita en claro para llamar a MSAL.
 */
@Injectable()
export class AesGcmEncryptionService implements EncryptionServicePort {
    private readonly logger = new Logger(AesGcmEncryptionService.name);
    private readonly key: Buffer;

    constructor(configService: ConfigService) {
        const rawKey = configService.get<string>('ENCRYPTION_KEY');
        if (!rawKey) {
            this.logger.warn(
                'ENCRYPTION_KEY no está definida; se usará una clave de desarrollo ' +
                    'insegura. Los secretos cifrados con ella (p. ej. ' +
                    'IntegracionMicrosoft.refreshToken) NO están protegidos — fijar ' +
                    'ENCRYPTION_KEY en cualquier entorno real (openssl rand -base64 32).',
            );
            this.key = INSECURE_DEFAULT_KEY;
            return;
        }
        this.key = Buffer.from(rawKey, 'base64');
        if (this.key.length !== KEY_LENGTH) {
            throw new Error(
                `ENCRYPTION_KEY debe decodificar a ${KEY_LENGTH} bytes en base64 (AES-256-GCM); generar con: openssl rand -base64 32`,
            );
        }
    }

    encrypt(plain: string): string {
        const iv = randomBytes(IV_LENGTH);
        const cipher = createCipheriv(ALGORITHM, this.key, iv);
        const ciphertext = Buffer.concat([
            cipher.update(plain, 'utf8'),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();
        return [
            iv.toString('base64'),
            authTag.toString('base64'),
            ciphertext.toString('base64'),
        ].join(':');
    }

    decrypt(ciphertext: string): string {
        const [ivB64, authTagB64, dataB64] = ciphertext.split(':');
        if (!ivB64 || !authTagB64 || !dataB64) {
            throw new Error('Formato de texto cifrado inválido.');
        }
        const decipher = createDecipheriv(
            ALGORITHM,
            this.key,
            Buffer.from(ivB64, 'base64'),
        );
        decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
        const plain = Buffer.concat([
            decipher.update(Buffer.from(dataB64, 'base64')),
            decipher.final(),
        ]);
        return plain.toString('utf8');
    }
}
