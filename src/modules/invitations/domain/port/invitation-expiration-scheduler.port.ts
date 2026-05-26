export interface InvitationExpirationSchedulerPort {
    scheduleExpiration(input: {
        invitationId: number;
        expiresAt: Date;
    }): Promise<void>;
}

export const INVITATION_EXPIRATION_SCHEDULER_PORT = Symbol(
    'INVITATION_EXPIRATION_SCHEDULER_PORT',
);
