export interface PasswordResetExpirationSchedulerPort {
    scheduleExpiration(input: {
        resetTokenId: number;
        expiresAt: Date;
    }): Promise<void>;
}

export const PASSWORD_RESET_EXPIRATION_SCHEDULER_PORT = Symbol(
    'PASSWORD_RESET_EXPIRATION_SCHEDULER_PORT',
);
