export class InvitationAlreadyAcceptedException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvitationAlreadyAcceptedException';
    }
}
