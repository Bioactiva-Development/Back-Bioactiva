export class InvalidInvitationTokenException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidInvitationTokenException';
    }
}
