export interface PasswordResetNotificationPort {
    sendResetPasswordEmail(correo: string, token: string): Promise<void>;
}

export const PASSWORD_RESET_NOTIFICATION = Symbol(
    'PASSWORD_RESET_NOTIFICATION',
);
