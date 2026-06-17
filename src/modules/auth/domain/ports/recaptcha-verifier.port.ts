export interface RecaptchaVerificationResult {
    valid: boolean;
    score: number;
}

export interface RecaptchaVerifierPort {
    verify(
        token: string,
        expectedAction: string,
    ): Promise<RecaptchaVerificationResult>;
}

export const RECAPTCHA_VERIFIER = Symbol('RECAPTCHA_VERIFIER');
