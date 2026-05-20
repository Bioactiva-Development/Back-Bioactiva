export interface InvitationTokenFactoryPort {
    generate(): string;
    hash(token: string): Promise<string>;
    verify(token: string, hash: string): Promise<boolean>;
}

export const INVITATION_TOKEN_FACTORY = Symbol('INVITATION_TOKEN_FACTORY');
