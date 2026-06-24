import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const mockCreateAssessment = jest.fn();
const mockProjectPath = jest.fn((id: string) => `projects/${id}`);

jest.mock('@google-cloud/recaptcha-enterprise', () => ({
    RecaptchaEnterpriseServiceClient: jest.fn().mockImplementation(() => ({
        createAssessment: mockCreateAssessment,
        projectPath: mockProjectPath,
    })),
}));

import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';
import { RecaptchaEnterpriseVerifier } from '@/modules/auth/infrastructure/recaptcha/recaptcha-enterprise.verifier';
import type { RecaptchaConfig } from '@/modules/auth/infrastructure/config/recaptcha.config';

/**
 * RecaptchaEnterpriseVerifier
 * ---------------------------
 * Verifica tokens contra Google reCAPTCHA Enterprise. Cubre el bypass cuando
 * está deshabilitado, los modos checkbox/score, y los casos de token inválido
 * y acción inesperada.
 */
describe('Auth module', () => {
    describe('RecaptchaEnterpriseVerifier', () => {
        const buildConfig = (
            overrides: Partial<RecaptchaConfig> = {},
        ): RecaptchaConfig =>
            ({
                enabled: true,
                projectId: 'project-1',
                siteKey: 'site-key',
                mode: 'score',
                ...overrides,
            }) as unknown as RecaptchaConfig;

        beforeEach(() => {
            mockCreateAssessment.mockReset();
            mockProjectPath.mockClear();
            (RecaptchaEnterpriseServiceClient as jest.Mock).mockClear();
        });

        it('bypasses verification when reCAPTCHA is disabled', async () => {
            const verifier = new RecaptchaEnterpriseVerifier(
                buildConfig({ enabled: false }),
            );

            const result = await verifier.verify('token', 'login');

            expect(result).toEqual({ valid: true, score: 1 });
            expect(mockCreateAssessment).not.toHaveBeenCalled();
        });

        it('returns invalid when tokenProperties is not valid', async () => {
            mockCreateAssessment.mockResolvedValue([
                { tokenProperties: { valid: false, invalidReason: 'EXPIRED' } },
            ]);
            const verifier = new RecaptchaEnterpriseVerifier(buildConfig());

            const result = await verifier.verify('token', 'login');

            expect(result).toEqual({ valid: false, score: 0 });
            expect(mockProjectPath).toHaveBeenCalledWith('project-1');
        });

        it('returns invalid when tokenProperties is missing entirely', async () => {
            mockCreateAssessment.mockResolvedValue([{}]);
            const verifier = new RecaptchaEnterpriseVerifier(buildConfig());

            const result = await verifier.verify('token', 'login');

            expect(result).toEqual({ valid: false, score: 0 });
        });

        it('returns valid with score 1 in checkbox mode', async () => {
            mockCreateAssessment.mockResolvedValue([
                { tokenProperties: { valid: true } },
            ]);
            const verifier = new RecaptchaEnterpriseVerifier(
                buildConfig({ mode: 'checkbox' }),
            );

            const result = await verifier.verify('token', 'login');

            expect(result).toEqual({ valid: true, score: 1 });
        });

        it('returns invalid in score mode when the action mismatches', async () => {
            mockCreateAssessment.mockResolvedValue([
                {
                    tokenProperties: { valid: true, action: 'other' },
                    riskAnalysis: { score: 0.9 },
                },
            ]);
            const verifier = new RecaptchaEnterpriseVerifier(buildConfig());

            const result = await verifier.verify('token', 'login');

            expect(result).toEqual({ valid: false, score: 0 });
        });

        it('returns the risk score in score mode when the action matches', async () => {
            mockCreateAssessment.mockResolvedValue([
                {
                    tokenProperties: { valid: true, action: 'login' },
                    riskAnalysis: { score: 0.8 },
                },
            ]);
            const verifier = new RecaptchaEnterpriseVerifier(buildConfig());

            const result = await verifier.verify('token', 'login');

            expect(result).toEqual({ valid: true, score: 0.8 });
        });

        it('defaults the score to 0 when riskAnalysis is absent', async () => {
            mockCreateAssessment.mockResolvedValue([
                { tokenProperties: { valid: true, action: 'login' } },
            ]);
            const verifier = new RecaptchaEnterpriseVerifier(buildConfig());

            const result = await verifier.verify('token', 'login');

            expect(result).toEqual({ valid: true, score: 0 });
        });

        it('reuses the same client across calls (lazy init)', async () => {
            mockCreateAssessment.mockResolvedValue([
                { tokenProperties: { valid: true, action: 'login' } },
            ]);
            const verifier = new RecaptchaEnterpriseVerifier(buildConfig());

            await verifier.verify('token', 'login');
            await verifier.verify('token', 'login');

            expect(RecaptchaEnterpriseServiceClient).toHaveBeenCalledTimes(1);
        });
    });
});
