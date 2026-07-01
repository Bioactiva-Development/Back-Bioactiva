import { describe, expect, it } from '@jest/globals';
import {
    signOAuthState,
    verifyOAuthState,
} from '@/modules/integrations/application/oauth-state';

describe('Integrations module', () => {
    describe('oauth-state', () => {
        describe('getStateSecret', () => {
            it('throws when neither MICROSOFT_STATE_SECRET nor JWT_SECRET is set', () => {
                const originalState = process.env.MICROSOFT_STATE_SECRET;
                const originalJwt = process.env.JWT_SECRET;
                delete process.env.MICROSOFT_STATE_SECRET;
                delete process.env.JWT_SECRET;

                let freshSignOAuthState: typeof signOAuthState;
                jest.isolateModules(() => {
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    freshSignOAuthState =
                        require('@/modules/integrations/application/oauth-state').signOAuthState;
                });

                try {
                    expect(() => freshSignOAuthState('7:nonce')).toThrow(
                        'Falta MICROSOFT_STATE_SECRET',
                    );
                } finally {
                    if (originalState !== undefined)
                        process.env.MICROSOFT_STATE_SECRET = originalState;
                    if (originalJwt !== undefined)
                        process.env.JWT_SECRET = originalJwt;
                }
            });
        });

        describe('signOAuthState', () => {
            it('produces a deterministic hex HMAC for the same payload', () => {
                const payload = '7:nonce:/leads';
                expect(signOAuthState(payload)).toBe(signOAuthState(payload));
                expect(signOAuthState(payload)).toMatch(/^[0-9a-f]{64}$/);
            });

            it('produces different signatures for different payloads', () => {
                expect(signOAuthState('7:a:/leads')).not.toBe(
                    signOAuthState('7:b:/leads'),
                );
            });
        });

        describe('verifyOAuthState', () => {
            const sign = (payload: string) =>
                `${payload}:${signOAuthState(payload)}`;

            it('returns the embedded userId for a validly signed state', () => {
                expect(verifyOAuthState(sign('7:nonce:/leads'))).toBe(7);
            });

            it('returns null when the state has no colon separator', () => {
                expect(verifyOAuthState('no-colon-here')).toBeNull();
            });

            it('returns null when the signature was tampered with', () => {
                const state = sign('7:nonce:/leads');
                const tampered = state.slice(0, -1) + (state.endsWith('0') ? '1' : '0');
                expect(verifyOAuthState(tampered)).toBeNull();
            });

            it('returns null when the signature has a different length than expected', () => {
                const payload = '7:nonce:/leads';
                expect(verifyOAuthState(`${payload}:abcd`)).toBeNull();
            });

            it('returns null when the signature is not valid hex', () => {
                const payload = '7:nonce:/leads';
                // Same length as a real sha256 hex digest (64 chars) but with
                // a non-hex character, so Buffer.from(sig, 'hex') truncates
                // and the resulting buffers differ in length.
                const bogus = 'z'.repeat(64);
                expect(verifyOAuthState(`${payload}:${bogus}`)).toBeNull();
            });

            it('returns null when the userId segment is not numeric', () => {
                expect(verifyOAuthState(sign('not-a-number:nonce'))).toBeNull();
            });
        });
    });
});
