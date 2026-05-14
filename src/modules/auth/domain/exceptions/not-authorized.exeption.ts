export class NotAuthorizedException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotAuthorizedException';
    }
}
