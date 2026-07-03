import { describe, expect, it, beforeEach } from '@jest/globals';
import type { ConfigService } from '@nestjs/config';
import { AesGcmEncryptionService } from '@/shared/infrastructure/service/aes-gcm-encryption.service';
import { randomBytes } from 'node:crypto';

describe('Shared module', () => {
    describe('AesGcmEncryptionService', () => {
        const validKey = randomBytes(32).toString('base64');

        const buildConfigService = (value: string | undefined) =>
            ({
                get: () => value,
            }) as unknown as ConfigService;

        let service: AesGcmEncryptionService;

        beforeEach(() => {
            service = new AesGcmEncryptionService(buildConfigService(validKey));
        });

        it('should encrypt and decrypt back to the original plaintext', () => {
            const plain = 'my-refresh-token-value';

            const ciphertext = service.encrypt(plain);

            expect(ciphertext).not.toBe(plain);
            expect(service.decrypt(ciphertext)).toBe(plain);
        });

        it('should produce a different ciphertext each time (random IV)', () => {
            const plain = 'same-input';

            const first = service.encrypt(plain);
            const second = service.encrypt(plain);

            expect(first).not.toBe(second);
            expect(service.decrypt(first)).toBe(plain);
            expect(service.decrypt(second)).toBe(plain);
        });

        it('should store ciphertext as iv:authTag:ciphertext (3 base64 segments)', () => {
            const ciphertext = service.encrypt('value');

            expect(ciphertext.split(':')).toHaveLength(3);
        });

        it('should fall back to an insecure default key when ENCRYPTION_KEY is missing, without throwing', () => {
            let fallbackService: AesGcmEncryptionService;

            expect(
                () =>
                    (fallbackService = new AesGcmEncryptionService(
                        buildConfigService(undefined),
                    )),
            ).not.toThrow();

            const plain = 'value';
            const ciphertext = fallbackService!.encrypt(plain);
            expect(fallbackService!.decrypt(ciphertext)).toBe(plain);
        });

        it('should throw when ENCRYPTION_KEY does not decode to 32 bytes', () => {
            const shortKey = randomBytes(16).toString('base64');

            expect(
                () => new AesGcmEncryptionService(buildConfigService(shortKey)),
            ).toThrow(/32 bytes/);
        });

        it('should throw when decrypting a malformed ciphertext', () => {
            expect(() => service.decrypt('not-a-valid-ciphertext')).toThrow(
                'Formato de texto cifrado inválido.',
            );
        });

        it('should throw when decrypting with a tampered auth tag', () => {
            const ciphertext = service.encrypt('value');
            const [iv, , data] = ciphertext.split(':');
            const tamperedAuthTag = Buffer.alloc(16, 1).toString('base64');
            const tampered = `${iv}:${tamperedAuthTag}:${data}`;

            expect(() => service.decrypt(tampered)).toThrow();
        });
    });
});
