export class InvalidInvitationDomainException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidInvitationDomainException';
    }
}
