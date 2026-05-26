export abstract class HashServicePort {
    abstract hash(value: string): string;

    abstract compare(plain: string, hashed: string): boolean;
}
