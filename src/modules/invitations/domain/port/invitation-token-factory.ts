export interface InvitationTokenFactoryPort {
    generate(): string;
    hash(token: string): Promise<string>;
    verify(token: string, hash: string): Promise<boolean>;
}
