export abstract class EncryptionServicePort {
    abstract encrypt(plain: string): string;

    abstract decrypt(ciphertext: string): string;
}
